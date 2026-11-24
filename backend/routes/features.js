import CardEvent from "../models/CardEvent.js";
import Notification from "../models/Notification.js";
import { canRead } from "../services/permissions.js";
import { Router } from "express";
import mongoose from "mongoose";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import Invitation from "../models/Invitation.js";
import EmailJob from "../models/EmailJob.js";
import { emailFrame } from "../services/mail.js";
import { frontendURL } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { projectAccess } from "../services/permissions.js";
import { fail, string, email } from "../utils/http.js";
const hash = (t) => createHash("sha256").update(t).digest("hex");
const Comment = mongoose.model(
  "Comment",
  new mongoose.Schema(
    {
      project: { type: String, index: true },
      card: Number,
      author: String,
      name: String,
      text: { type: String, maxlength: 4000 },
      clientId: String,
      reactions: [{user:String,emoji:String,_id:false}],
    },
    { timestamps: true },
  ),
);
Comment.schema.index({ author: 1, clientId: 1 }, { unique: true });
const Attachment = mongoose.model(
  "Attachment",
  new mongoose.Schema(
    {
      project: String,
      card: Number,
      name: String,
      mime: String,
      data: Buffer,
      author: String,
    },
    { timestamps: true },
  ),
);
const Help = mongoose.model(
  "Help",
  new mongoose.Schema(
    {
      project: String,
      card: Number,
      author: String,
      name: String,
      recipient: String,
      question: String,
      response: String,
      status: { type: String, default: "Open" },
      pinned: { type: Boolean, default: false },
      clientId: { type: String, unique: true },
    },
    { timestamps: true },
  ),
);
export const features = Router();
features.post(
  "/auth/forgot-password",
  rateLimit({ windowMs: 900000, limit: 8 }),
  async (req, res) => {
    const u = await User.findOne({ email: email(req.body.email) });
    if (u) {
      const token = randomBytes(32).toString("hex");
      u.resetHash = hash(token);
      u.resetExpires = new Date(Date.now() + 1800000);
      await u.save();
      const url = frontendURL() + "/reset-password?token=" + token;
      await EmailJob.create({
        key: "reset:" + hash(token),
        to: u.email,
        subject: "Reset your Flowe password",
        html: emailFrame({
          eyebrow: "A FRESH START",
          title: "Find your flow again.",
          body: "This single-use link expires in 30 minutes. If you did not request it, ignore this email.",
          cta: "Choose a new password",
          url,
        }),
        text: "Reset your password: " + url,
      });
    }
    res.json({
      message: "If this account exists, a reset link has been sent.",
    });
  },
);
features.post(
  "/auth/reset-password",
  rateLimit({ windowMs: 900000, limit: 20 }),
  async (req, res) => {
    const { token, password } = req.body;
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password) > 72
    )
      fail(400, "Use a valid link and a password of 8–72 bytes");
    const u = await User.findOneAndUpdate(
      { resetHash: hash(token), resetExpires: { $gt: new Date() } },
      {
        $set: { passwordHash: await bcrypt.hash(password, 12) },
        $unset: { resetHash: 1, resetExpires: 1 },
      },
      { new: true },
    );
    if (!u) fail(400, "This reset link has expired or has already been used");
    res.json({ message: "Password updated. You can now sign in." });
  },
);
features.use((req, res, next) =>
  req.path.startsWith("/auth/") || req.path.startsWith("/invitations/")
    ? next("router")
    : requireAuth(req, res, next),
);
features.get('/notifications',async(req,res)=>{
 const notifications=await Notification.find({user:req.session.userId}).sort({createdAt:-1}).limit(80).lean();
 res.json({notifications});
});
features.patch('/notifications/:id/read',async(req,res)=>{
 const note=await Notification.findOneAndUpdate({_id:req.params.id,user:req.session.userId},{$set:{seen:true}},{new:true});
 if(!note)fail(404,'Notification unavailable');
 res.json({notification:note});
});
features.post('/notifications/read-all',async(req,res)=>{
 await Notification.updateMany({user:req.session.userId,seen:false},{$set:{seen:true}});
 res.json({ok:true});
});
features.patch("/workspaces/:workspaceId/members/:userId", async (req, res) => {
  const w = await Workspace.findOne({
    _id: req.params.workspaceId,
    owner: req.session.userId,
  });
  if (!w) fail(403, "Owner access required");
  if (String(w.owner) === req.params.userId)
    fail(400, "The owner cannot be removed or demoted");
  if (!["member", "reader", "remove"].includes(req.body.role))
    fail(400, "Invalid role");
  if (req.body.role === "remove")
    w.members = w.members.filter((m) => String(m.user) !== req.params.userId);
  else {
    const m = w.members.find((m) => String(m.user) === req.params.userId);
    if (!m) fail(404, "Member not found");
    m.role = req.body.role;
  }
  await w.save();
  req.app.locals.io?.in("u:" + req.params.userId).disconnectSockets(true);
  res.json({ workspace: w });
});
features.get("/workspaces/:workspaceId/invitations", async (req, res) => {
  if (
    !(await Workspace.exists({
      _id: req.params.workspaceId,
      owner: req.session.userId,
    }))
  )
    fail(403, "Owner access required");
  res.json({
    invitations: await Invitation.find({
      workspace: req.params.workspaceId,
      revokedAt: null,
    }).sort({createdAt:-1}).select("email expiresAt acceptedAt createdAt invitedBy"),
  });
});
features.delete(
  "/workspaces/:workspaceId/invitations/:id",
  async (req, res) => {
    if (
      !(await Workspace.exists({
        _id: req.params.workspaceId,
        owner: req.session.userId,
      }))
    )
      fail(403, "Owner access required");
    const changed = await Invitation.findOneAndUpdate({
      _id: req.params.id,
      workspace: req.params.workspaceId,
      acceptedAt: null,
      revokedAt: null,
    }, {$set:{revokedAt:new Date()}});
    if(!changed) fail(404, 'Pending invitation not found');
    res.status(204).end();
  },
);
features.use(
  "/workspaces/:workspaceId/projects/:projectId",
  async (req, res, next) => {
    if (req.url === "/") return next();
    const { p, w } = await projectAccess(
      req.params.workspaceId,
      req.params.projectId,
      req.session.userId,
      !["GET", "HEAD"].includes(req.method),
    );
    req.project = p;
    req.workspace = w;
    next();
  },
);
const base = "/workspaces/:workspaceId/projects/:projectId";
// Compact card indicators are hydrated in one read, avoiding an API call per card.
features.get(base + "/card-badges", async (req, res) => {
  const id = String(req.project._id);
  const [comments, files] = await Promise.all([
    Comment.aggregate([{ $match: { project: id } }, { $group: { _id: "$card", count: { $sum: 1 } } }]),
    Attachment.aggregate([{ $match: { project: id } }, { $group: { _id: "$card", count: { $sum: 1 } } }]),
  ]);
  const badges = {};
  for (const item of comments) (badges[item._id] ||= {}).comments = item.count;
  for (const item of files) (badges[item._id] ||= {}).files = item.count;
  res.json({ badges });
});
async function notifyListWatchers(req, text, excluded = []) {
  const currentList = req.project.lists.find(l => l.cards.some(c => c.id === Number(req.params.cardId)));
  if (!currentList) return;
  const actor = await User.findById(req.session.userId).select('name');
  // A user explicitly watching a list also receives their own meaningful changes.
  const ignored = new Set(excluded.map(String));
  for (const id of new Set((currentList.watchers || []).map(String))) {
    if (ignored.has(id) || !canRead(req.project, req.workspace, id)) continue;
    const notification = await Notification.create({
      user: id, workspace: req.params.workspaceId, project: req.project.id,
      card: Number(req.params.cardId), actor: actor?.name || 'Teammate', kind: 'card',
      text: `${actor?.name || 'Someone'} ${text}`.slice(0, 240),
    });
    req.app.locals.io?.to('u:' + id).emit('notification', notification);
  }
}
function card(req) {
  const c = req.project.lists
    .flatMap((l) => l.cards)
    .find((c) => c.id === Number(req.params.cardId));
  if (!c) fail(404, "Card not found");
  return c;
}
features.get(base + "/cards/:cardId/activity", async (req, res) => {
  card(req);
  res.json({
    events: await CardEvent.find({project:String(req.project._id),card:Number(req.params.cardId)}).sort({createdAt:-1}).limit(100).lean(),
    help: await Help.find({
      project: req.project.id,
      card: Number(req.params.cardId),
    }).sort({ createdAt: 1 }),
    comments: await Comment.find({
      project: req.project.id,
      card: Number(req.params.cardId),
    }).sort({ createdAt: 1 }),
    files: await Attachment.find({
      project: req.project.id,
      card: Number(req.params.cardId),
    }).select("-data"),
  });
});
features.post(base + "/cards/:cardId/comments", async (req, res) => {
  card(req);
  const text = string(req.body.text, "Comment", 4000),
    clientId = string(req.body.clientId, "Request ID", 100);
  const u = await User.findById(req.session.userId);
  const comment = await Comment.findOneAndUpdate(
    { author: u.id, clientId },
    {
      $setOnInsert: {
        project: req.project.id,
        card: Number(req.params.cardId),
        name: u.name,
        text,
      },
    },
    { upsert: true, new: true },
  );
  req.app.locals.io
    ?.to("p:" + req.project.id)
    .emit("activityChanged", { card: Number(req.params.cardId) });
  // Explicit mentions notify only members who may actually read this project.
  const tagged=new Set();
  const names=await User.find({_id:{$in:req.workspace.members.map(m=>m.user)}}).select('name');
  if(/@board\b/i.test(text))for(const m of req.workspace.members)tagged.add(String(m.user));
  if(/@card\b/i.test(text)){
    const assigned=card(req).assignee;if(assigned)tagged.add(String(assigned));
  }
  for(const m of names){
    const handle=(m.name||'').replace(/\s+/g,'').toLowerCase();
    if(handle && text.toLowerCase().includes('@'+handle))tagged.add(String(m._id));
  }
  const recipients=[...tagged].filter(id=>id!==req.session.userId && canRead(req.project,req.workspace,id));
  for(const id of recipients){
    const notification=await Notification.create({user:id,workspace:req.params.workspaceId,project:req.project.id,card:Number(req.params.cardId),actor:u.name,kind:'mention',text:`${u.name} mentioned you: ${text.slice(0,130)}`});
    req.app.locals.io?.to('u:'+id).emit('notification',notification);
  }
  await notifyListWatchers(req, 'commented on a card you watch', recipients);
  res.json({ comment });
});
features.patch(base+'/cards/:cardId/comments/:commentId',async(req,res)=>{
 card(req);
 const c=await Comment.findOneAndUpdate({_id:req.params.commentId,project:req.project.id,card:Number(req.params.cardId),author:req.session.userId},{$set:{text:string(req.body.text,'Comment',4000)}},{new:true});
 if(!c)fail(404,'Your comment was not found');
 req.app.locals.io?.to('p:'+req.project.id).emit('activityChanged',{card:Number(req.params.cardId)});
 await notifyListWatchers(req, 'edited a comment in a watched list');
 res.json({comment:c});
});
features.post(base+'/cards/:cardId/comments/:commentId/react',async(req,res)=>{
  card(req);
  const emoji=req.body?.emoji;
  if (!['👍','❤️','🎉','😊'].includes(emoji)) fail(400,'Unsupported reaction');
  const comment=await Comment.findOne({_id:req.params.commentId,project:req.project.id,card:Number(req.params.cardId)});
  if(!comment)fail(404,'Comment not found');
  const user=String(req.session.userId);
  const reactions=(comment.reactions||[]).map(r=>({user:String(r.user),emoji:r.emoji}));
  const has=reactions.some(r=>r.user===user&&r.emoji===emoji);
  comment.reactions=has?reactions.filter(r=>!(r.user===user&&r.emoji===emoji)):[...reactions,{user,emoji}];
  await comment.save();
  req.app.locals.io?.to('p:'+req.project.id).emit('activityChanged',{card:Number(req.params.cardId)});
  await notifyListWatchers(req,'reacted to a comment in a watched list');
  res.json({comment});
});
features.delete(base+'/cards/:cardId/comments/:commentId',async(req,res)=>{
 card(req);
 const c=await Comment.findOneAndDelete({_id:req.params.commentId,project:req.project.id,card:Number(req.params.cardId),author:req.session.userId});
 if(!c)fail(404,'Your comment was not found');
 req.app.locals.io?.to('p:'+req.project.id).emit('activityChanged',{card:Number(req.params.cardId)});
 await notifyListWatchers(req, 'deleted a comment in a watched list');
 res.json({ok:true});
});
features.post(base + "/cards/:cardId/files", async (req, res) => {
  card(req);
  if (typeof req.body.data !== "string" || req.body.data.length > 4000000)
    fail(400, "File too large (3 MB maximum)");
  const data = Buffer.from(req.body.data, "base64");
  if (!data.length || data.length > 3000000) fail(400, "Invalid file");
  const inferredMime = data.subarray(0,4).toString('hex')==='89504e47'?'image/png':
    data.subarray(0,3).toString('hex')==='ffd8ff'?'image/jpeg':
    data.subarray(0,4).toString('utf8')==='%PDF'?'application/pdf':
    data.subarray(0,4).toString('utf8')==='RIFF'&&data.subarray(8,12).toString('utf8')==='WEBP'?'image/webp':'application/octet-stream';
  const file = await Attachment.create({
    mime: inferredMime,
    project: req.project.id,
    card: Number(req.params.cardId),
    name: string(req.body.name, "Filename", 200),
    data,
    author: req.session.userId,
  });
  req.app.locals.io?.to('p:'+req.project.id).emit('activityChanged',{card:Number(req.params.cardId)});
  await notifyListWatchers(req, 'attached a file to a watched card');
  res.json({ file: { _id: file.id, name: file.name } });
});
features.get(base + "/files/:fileId", async (req, res) => {
  const file = await Attachment.findOne({
    _id: req.params.fileId,
    project: req.project.id,
  });
  if (!file) fail(404, "File unavailable");
  const inline=req.query.inline==='1' && ['image/png','image/jpeg','image/webp','application/pdf'].includes(file.mime);
  res.set('Content-Type',inline?file.mime:'application/octet-stream')
    .set('Content-Disposition',`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`)
    .set('X-Content-Type-Options','nosniff')
    .set('Content-Security-Policy','sandbox')
    .set('Cache-Control','private, no-store')
    .send(file.data);
});
features.delete(base + "/cards/:cardId/files/:fileId", async (req, res) => {
  card(req);
  if (!req.workspace.members.some(m=>String(m.user)===req.session.userId && m.role!=='reader'))
    fail(403, "Read-only members cannot delete attachments");
  const removed=await Attachment.findOneAndDelete({
    _id:req.params.fileId,project:req.project.id,card:Number(req.params.cardId)
  });
  if(!removed) fail(404,"Attachment not found");
  req.app.locals.io?.to('p:'+req.project.id).emit('activityChanged',{card:Number(req.params.cardId)});
  await notifyListWatchers(req, 'removed an attachment from a watched card');
  res.json({ok:true});
});
features.post(base + "/cards/:cardId/help", async (req, res) => {
  card(req);
  const { p, w } = await projectAccess(
    req.params.workspaceId,
    req.params.projectId,
    req.body.recipient,
  );
  const author = await User.findById(req.session.userId);
  const help = await Help.findOneAndUpdate(
    { clientId: string(req.body.clientId, "Request ID", 100) },
    {
      $setOnInsert: {
        project: p.id,
        card: Number(req.params.cardId),
        author: author.id,
        name: author.name,
        recipient: req.body.recipient,
        question: string(req.body.question, "Question", 2000),
      },
    },
    { upsert: true, new: true },
  );
  req.app.locals.io
    ?.to("u:" + req.body.recipient)
    .emit("cardHelp", {
      project: p.id,
      workspace: String(w._id),
      card: Number(req.params.cardId),
      name: author.name,
    });
  res.json({ help });
});
features.patch(base + "/cards/:cardId/help/:helpId", async (req, res) => {
  card(req);
  const help = await Help.findOne({
    _id: req.params.helpId,
    project: req.project.id,
    card: Number(req.params.cardId),
  });
  if (!help) fail(404, "Request unavailable");
  if (req.body.pinned !== undefined) {
    if (help.author !== req.session.userId)
      fail(403, "Only the requester can pin the answer");
    help.pinned = !!req.body.pinned;
  } else {
    if (help.recipient !== req.session.userId)
      fail(403, "Only the invited colleague can respond");
    if (!["Answered", "Deferred", "Joined"].includes(req.body.status))
      fail(400, "Invalid response");
    help.status = req.body.status;
    if (req.body.status === "Answered")
      help.response = string(req.body.response, "Reply", 2000);
  }
  await help.save();
  res.json({ help });
});
