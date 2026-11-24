import Notification from "./models/Notification.js";
import { projectAccess, canRead } from "./services/permissions.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Workspace from "./models/Workspace.js";
import User from "./models/User.js";
import Project from "./models/Project.js";
const Conversation = mongoose.model(
  "Conversation",
  new mongoose.Schema(
    {
      workspace: String,
      name: String,
      participants: [String],
      key: { type: String, unique: true, sparse: true },
      read: { type: Map, of: Date },
    },
    { timestamps: true },
  ),
);
const Message = mongoose.model(
  "Message",
  new mongoose.Schema(
    {
      conversation: { type: String, index: true },
      sender: String,
      name: String,
      text: String,
      card: mongoose.Schema.Types.Mixed,
      clientId: String,
    },
    { timestamps: true },
  ),
);
Message.schema.index({ sender: 1, clientId: 1 }, { unique: true });
export function attachRealtime(server, app) {
  const io = new Server(server, {
    maxHttpBufferSize: 16000,
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
    allowRequest: (req, cb) => cb(null, true),
  });
  io.engine.use(app.locals.sessionMiddleware);
  app.locals.io = io;
  io.use(async (s, next) => {
    try {
      if (!s.request.session.userId) throw Error();
      s.data.user = await User.findById(s.request.session.userId);
      if (!s.data.user) throw Error();
      next();
    } catch {
      next(Error("Please sign in"));
    }
  });
  async function presence(w) {
    const sockets = await io.in("w:" + w).fetchSockets();
    const people = [
      ...new Map(
        sockets.map((s) => [
          String(s.data.user._id),
          { id: String(s.data.user._id), name: s.data.user.name },
        ]),
      ).values(),
    ];
    io.to("w:" + w).emit("presence", people);
  }
  io.on("connection", (s) => {
    const uid = String(s.data.user._id);
    s.join("u:" + uid);
    async function access() {
      await new Promise((yes, no) =>
        s.request.session.reload((e) => (e ? no(e) : yes())),
      );
      if (s.request.session.userId !== uid) throw Error("Session expired");
      if (
        !(await Workspace.exists({
          _id: s.data.workspace,
          "members.user": uid,
        }))
      )
        throw Error("Workspace access denied");
      if (s.data.project)
        await projectAccess(s.data.workspace, s.data.project, uid);
    }
    function handle(event, fn) {
      s.on(event, async (data, ack = () => {}) => {
        if (typeof ack !== "function") ack = () => {};
        try {
          if (event !== "join") await access();
          ack({ ok: true, ...(await fn(data || {})) });
        } catch (e) {
          ack({ ok: false, message: e.message || "Request failed" });
        }
      });
    }
    handle("join", async ({ workspace, project }) => {
      if (!/^[a-f0-9]{24}$/i.test(workspace)) throw Error("Invalid workspace");
      if (!(await Workspace.exists({ _id: workspace, "members.user": uid })))
        throw Error("Access denied");
      const old = s.data.workspace;
      if (old) s.leave("w:" + old);
      if (s.data.project) s.leave("p:" + s.data.project);
      s.data.workspace = workspace;
      s.data.project = null;
      s.join("w:" + workspace);
      if (project) {
        await projectAccess(workspace, project, uid);
        s.data.project = project;
        s.join("p:" + project);
      }
      if (old) await presence(old);
      await presence(workspace);
      return {};
    });
    handle("conversations", async () => {
      const cs = await Conversation.find({
        workspace: s.data.workspace,
        participants: uid,
      }).lean();
      for (const c of cs)
        c.unread = await Message.countDocuments({
          conversation: String(c._id),
          sender: { $ne: uid },
          createdAt: { $gt: c.read?.[uid] || new Date(0) },
        });
      return { conversations: cs };
    });
    handle("createConversation", async ({ participants, name, clientId }) => {
      if (!Array.isArray(participants) || participants.length > 30)
        throw Error("Choose members");
      const ids = [...new Set([uid, ...participants])];
      if (ids.length < 2) throw Error("Choose another member");
      const w = await Workspace.findById(s.data.workspace);
      if (ids.some((id) => !w.members.some((m) => String(m.user) === id)))
        throw Error("Only workspace members can join");
      let c =
        ids.length === 2
          ? await Conversation.findOne({
              workspace: s.data.workspace,
              participants: { $all: ids, $size: 2 },
            })
          : null;
      if (!c) {
        const key =
          ids.length === 2
            ? s.data.workspace + ":" + ids.sort().join(":")
            : s.data.workspace +
              ":" +
              uid +
              ":" +
              String(clientId || Date.now());
        try {
          c = await Conversation.findOneAndUpdate(
            { key },
            {
              $setOnInsert: {
                workspace: s.data.workspace,
                participants: ids,
                name: String(name || "New conversation").slice(0, 80),
              },
            },
            { upsert: true, new: true },
          );
        } catch (e) {
          if (e.code !== 11000) throw e;
          c = await Conversation.findOne({ key });
        }
      }
      ids.forEach((id) => io.to("u:" + id).emit("conversationChanged"));
      return { conversation: c };
    });
    async function conversation(id) {
      const c = await Conversation.findOne({
        _id: id,
        workspace: s.data.workspace,
        participants: uid,
      });
      if (!c) throw Error("Conversation unavailable");
      return c;
    }
    handle("history", async ({ id, before }) => {
      await conversation(id);
      const messages = await Message.find({
        conversation: id,
        ...(before ? { createdAt: { $lt: new Date(before) } } : {}),
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      return { messages: messages.reverse() };
    });
    handle("read", async ({ id }) => {
      await conversation(id);
      await Conversation.updateOne(
        { _id: id },
        { $set: { ["read." + uid]: new Date() } },
      );
      io.to("u:" + uid).emit("conversationChanged");
      return {};
    });
    handle("send", async ({ id, text, clientId, card }) => {
      const c = await conversation(id);
      if (
        typeof text !== "string" ||
        !text.trim() ||
        text.length > 4000 ||
        typeof clientId !== "string" ||
        clientId.length > 80
      )
        throw Error("Invalid message");
      const existing = await Message.findOne({ sender: uid, clientId });
      if (existing) {
        if (existing.conversation !== id)
          throw Error("Request ID already used");
        return { message: existing };
      }
      if (Date.now() - (s.data.lastSend || 0) < 250)
        throw Error("Please slow down");
      s.data.lastSend = Date.now();
      let shared;
      if (card) {
        const { p, w } = await projectAccess(
          s.data.workspace,
          card.project,
          uid,
        );
        if (
          c.participants.some(
            (id) =>
              !w.members.some((m) => String(m.user) === id) ||
              !canRead(p, w, id),
          )
        )
          throw Error("Every recipient must have project access");
        const item = p.lists
          .flatMap((l) => l.cards)
          .find((x) => x.id === Number(card.id));
        if (!item) throw Error("Card unavailable");
        shared = { project: p.id, id: item.id };
      }
      let m = await Message.findOne({ sender: uid, clientId });
      if (!m)
        m = await Message.create({
          conversation: id,
          sender: uid,
          name: s.data.user.name,
          text: text.trim(),
          clientId,
          card: shared,
        });
      const w = await Workspace.findById(s.data.workspace);
      const recipients=c.participants.filter(p=>p!==uid && w.members.some(x=>String(x.user)===p));
      c.participants.filter(p=>w.members.some(x=>String(x.user)===p))
        .forEach(p=>io.to('u:'+p).emit('message',m));
      for(const recipient of recipients){
        const notification=await Notification.create({user:recipient,workspace:s.data.workspace,actor:s.data.user.name,kind:'message',text:`${s.data.user.name}: ${m.text.slice(0,150)}`});
        io.to('u:'+recipient).emit('notification',notification);
      }
      return { message: m };
    });

    handle("cardPreview", async ({ project, cardId }) => {
      const { p } = await projectAccess(s.data.workspace, project, uid);
      const c = p.lists
        .flatMap((l) => l.cards)
        .find((c) => c.id === Number(cardId));
      if (!c) throw Error("Card unavailable");
      return { card: { id: c.id, title: c.title, project: p.id } };
    });
    handle(
      "messageToCard",
      async ({ id, messageId, project, column, title }) => {
        await conversation(id);
        const m = await Message.findOne({ _id: messageId, conversation: id });
        if (!m) throw Error("Message unavailable");
        const { p } = await projectAccess(s.data.workspace, project, uid, true);
        const source = "message:" + m.id;
        const existing = p.lists
          .flatMap((l) => l.cards)
          .find((c) => c.source === source);
        if (existing) return { card: existing, project: p.id };
        const l = p.lists.find((l) => l.id === Number(column));
        if (!l) throw Error("Choose a column");
        if (typeof title !== "string" || !title.trim() || title.length > 240)
          throw Error("Choose a title");
        const card = {
          id: Date.now(),
          title: title.trim(),
          detail: title.trim(),
          source,
        };
        l.cards.push(card);
        const updated = await Project.findOneAndUpdate(
          { _id: p._id, revision: p.revision },
          { $set: { lists: p.lists }, $inc: { revision: 1 } },
          { new: true, runValidators: true },
        );
        if (!updated) throw Error("Project changed. Please retry.");
        io.to("p:" + p.id).emit("projectChanged", updated);
        return { card, project: p.id };
      },
    );
    handle("typing", async ({ id }) => {
      const c = await conversation(id);
      if (Date.now() - (s.data.lastType || 0) < 900) return {};
      s.data.lastType = Date.now();
      c.participants
        .filter((p) => p !== uid)
        .forEach((p) =>
          io.to("u:" + p).emit("typing", { id, name: s.data.user.name }),
        );
      return {};
    });
    handle("cursor", async (d) => {
      if (!s.data.project || Date.now() - (s.data.cursorTime || 0) < 70)
        return {};
      s.data.cursorTime = Date.now();
      if (
        !Number.isFinite(d.x) ||
        !Number.isFinite(d.y) ||
        Math.abs(d.x) > 100000 ||
        Math.abs(d.y) > 100000
      )
        return {};
      s.to("p:" + s.data.project).emit("cursor", {
        ...d,
        id: s.id,
        name: s.data.user.name,
        userId: uid,
      });
      return {};
    });

    const sessionCheck = setInterval(
      () =>
        s.request.session.reload((e) => {
          if (e || s.request.session.userId !== uid) s.disconnect(true);
        }),
      15000,
    );
    s.on("disconnect", () => {
      clearInterval(sessionCheck);
      if (s.data.workspace) void presence(s.data.workspace);
      if (s.data.project) io.to("p:" + s.data.project).emit("cursorGone", s.id);
    });
  });
  return io;
}
