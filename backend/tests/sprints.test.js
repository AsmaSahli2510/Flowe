import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import session from "express-session";
import request from "supertest";
import { createServer } from "node:http";
import { io } from "../../frontend/node_modules/socket.io-client/build/esm/index.js";
import { createApp } from "../app.js";
import { attachRealtime } from "../realtime.js";
import Workspace from "../models/Workspace.js";
import Project from "../models/Project.js";
import EmailJob from "../models/EmailJob.js";
let mongo,
  app,
  http,
  realtime,
  w,
  p,
  accounts = [],
  sockets = [];
const origin = "http://localhost:5173";
const send = (a, path, body, method = "post") =>
  a[method]("/api" + path)
    .set("Origin", origin)
    .send(body);
const base = () => `/workspaces/${w._id}/projects/${p._id}`;
before(async () => {
  process.env.SESSION_SECRET = "a-test-secret-long-enough-for-flowe";
  process.env.FRONTEND_URL = origin;
  mongo = await MongoMemoryServer.create({
    instance: { args: ["--nounixsocket"] },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app = createApp({ store: new session.MemoryStore() });
  http = createServer(app);
  realtime = attachRealtime(http, app);
  await new Promise((r) => http.listen(0, "127.0.0.1", r));
  for (const name of ["Owner", "Member", "Reader", "Outsider"]) {
    const a = request.agent(app),
      res = await send(a, "/auth/signup", {
        name,
        email: name.toLowerCase() + "@test.example",
        password: "password123",
      });
    accounts.push({
      a,
      id: res.body.user.id,
      cookie: res.headers["set-cookie"][0].split(";")[0],
    });
  }
  w = (await send(accounts[0].a, "/workspaces", { name: "Garden" })).body
    .workspace;
  await Workspace.updateOne(
    { _id: w._id },
    {
      $push: {
        members: {
          $each: [
            { user: accounts[1].id, role: "member" },
            { user: accounts[2].id, role: "reader" },
          ],
        },
      },
    },
  );
  p = (
    await send(accounts[0].a, `/workspaces/${w._id}/projects`, {
      name: "Launch",
      template: "scrum",
    })
  ).body.project;
});
after(async () => {
  sockets.forEach((s) => s.disconnect());
  await new Promise((r) => realtime.close(r));
  await mongoose.disconnect();
  await mongo.stop();
});
async function patch(data, a = accounts[0].a) {
  const current = await Project.findById(p._id);
  return send(a, base(), { revision: current.revision, ...data }, "patch");
}
async function connect(account) {
  const s = io("http://127.0.0.1:" + http.address().port, {
    extraHeaders: { Origin: origin, Cookie: account.cookie },
    transports: ["websocket"],
  });
  sockets.push(s);
  await new Promise((r, j) => {
    s.once("connect", r);
    s.once("connect_error", j);
  });
  return s;
}
const call = (s, event, data = {}) => s.timeout(5000).emitWithAck(event, data);
test("readers cannot mutate projects and outsiders cannot read activity", async () => {
  assert.equal((await patch({ name: "Bad" }, accounts[2].a)).status, 403);
  assert.equal(
    (await accounts[3].a.get("/api" + base() + "/cards/1/activity")).status,
    404,
  );
});
test("private projects restrict listings, cards, files and realtime joins", async () => {
  assert.equal(
    (await patch({ visibility: "Private", members: [accounts[1].id] })).status,
    200,
  );
  assert.equal(
    (await accounts[2].a.get(`/api/workspaces/${w._id}/projects`)).body.projects
      .length,
    0,
  );
  const r = await connect(accounts[2]);
  assert.equal(
    (await call(r, "join", { workspace: w._id, project: p._id })).ok,
    false,
  );
  assert.equal((await patch({ visibility: "Workspace" })).status, 200);
});
test("rich cards persist checklist, assignment, labels, fields and deadlines", async () => {
  const lists = p.lists;
  lists[0].cards = [
    {
      id: 100,
      title: "Ship the garden",
      assignee: accounts[1].id,
      priority: "High",
      due: "2026-12-20",
      labels: ["Release"],
      checklist: [
        { id: "one", text: "Review", done: true },
        { id: "two", text: "Ship", done: false },
      ],
      fields: { Effort: "5" },
      dependencies: [],
    },
    { id: 101, title: "Celebrate", dependencies: [100] },
  ];
  const res = await patch({ lists });
  assert.equal(res.status, 200);
  p = res.body.project;
  assert.equal(p.lists[0].cards[0].done, 1);
  assert.equal(p.lists[0].cards[0].checks, 2);
  assert.equal(p.lists[0].cards[0].fields.Effort, "5");
});
test("dependency cycles, duplicate card ids, outsider assignments and stale saves are rejected", async () => {
  let lists = structuredClone(p.lists);
  lists[0].cards[0].dependencies = [101];
  assert.equal((await patch({ lists })).status, 400);
  lists = structuredClone(p.lists);
  lists[0].cards[0].assignee = accounts[3].id;
  assert.equal((await patch({ lists })).status, 400);
  lists = structuredClone(p.lists);
  lists[0].cards[1].id = 100;
  assert.equal((await patch({ lists })).status, 400);
  assert.equal(
    (await send(accounts[0].a, base(), { revision: 0, name: "Stale" }, "patch"))
      .status,
    409,
  );
});
test("comments retry once; files require current project membership", async () => {
  const path = base() + "/cards/100";
  const payload = { text: "Looks good", clientId: "comment-once" };
  assert.equal(
    (await send(accounts[1].a, path + "/comments", payload)).status,
    200,
  );
  await send(accounts[1].a, path + "/comments", payload);
  assert.equal(
    (await accounts[1].a.get("/api" + path + "/activity")).body.comments.length,
    1,
  );
  const f = await send(accounts[1].a, path + "/files", {
    name: "review.txt",
    data: Buffer.from("approved").toString("base64"),
  });
  assert.equal(f.status, 200);
  assert.equal(
    (await accounts[1].a.get("/api" + base() + "/files/" + f.body.file._id))
      .status,
    200,
  );
  assert.equal(
    (await accounts[3].a.get("/api" + base() + "/files/" + f.body.file._id))
      .status,
    404,
  );
});
test("project archive retains data and refuses editing until restoration", async () => {
  assert.equal((await patch({ archived: true })).status, 200);
  assert.equal(
    (
      await send(accounts[1].a, base() + "/cards/100/comments", {
        text: "No",
        clientId: "archived",
      })
    ).status,
    403,
  );
  assert.equal(
    (await patch({ archived: false })).body.project.lists[0].cards[0].title,
    "Ship the garden",
  );
});
test("help requests only target project members and requester pins answers", async () => {
  const path = base() + "/cards/100/help";
  const r = await send(accounts[0].a, path, {
    clientId: "help-once",
    recipient: accounts[1].id,
    question: "Can you review?",
  });
  assert.equal(r.status, 200);
  assert.equal(
    (
      await send(
        accounts[1].a,
        path + "/" + r.body.help._id,
        { status: "Answered", response: "Reviewed" },
        "patch",
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await send(
        accounts[1].a,
        path + "/" + r.body.help._id,
        { pinned: true },
        "patch",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await send(
        accounts[0].a,
        path + "/" + r.body.help._id,
        { pinned: true },
        "patch",
      )
    ).status,
    200,
  );
  assert.equal(
    (await accounts[0].a.get("/api" + base() + "/cards/100/activity")).body
      .help[0].pinned,
    true,
  );
});
test("password reset tokens expire, are single-use and replace old password", async () => {
  const a = accounts[3].a;
  assert.equal(
    (await send(a, "/auth/forgot-password", { email: "outsider@test.example" }))
      .status,
    200,
  );
  const job = await EmailJob.findOne({
    to: "outsider@test.example",
    key: /^reset:/,
  });
  const token = new URL(job.text.split(" ").at(-1)).searchParams.get("token");
  assert.equal(
    (
      await send(a, "/auth/reset-password", {
        token,
        password: "new-password-123",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await send(a, "/auth/reset-password", {
        token,
        password: "another-password",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await send(a, "/auth/login", {
        email: "outsider@test.example",
        password: "password123",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await send(a, "/auth/login", {
        email: "outsider@test.example",
        password: "new-password-123",
      })
    ).status,
    200,
  );
});
test("realtime direct-thread deduplication, message retry and access eviction", async () => {
  const a = await connect(accounts[0]),
    b = await connect(accounts[1]);
  for (const s of [a, b])
    assert.equal(
      (await call(s, "join", { workspace: w._id, project: p._id })).ok,
      true,
    );
  const [c1, c2] = await Promise.all([
    call(a, "createConversation", {
      participants: [accounts[1].id],
      name: "Team",
    }),
    call(b, "createConversation", {
      participants: [accounts[0].id],
      name: "Team",
    }),
  ]);
  assert.equal(c1.conversation._id, c2.conversation._id);
  const m = {
    id: c1.conversation._id,
    text: "Hello",
    clientId: "unique-message",
    card: { project: p._id, id: 100 },
  };
  assert.equal((await call(a, "send", m)).ok, true);
  assert.equal((await call(a, "send", m)).ok, true);
  assert.equal(
    (await call(b, "history", { id: c1.conversation._id })).messages.length,
    1,
  );
  const gone = new Promise((r) => b.once("disconnect", r));
  await send(
    accounts[0].a,
    `/workspaces/${w._id}/members/${accounts[1].id}`,
    { role: "remove" },
    "patch",
  );
  await gone;
  assert.equal(
    (await accounts[1].a.get("/api" + base() + "/cards/100/activity")).status,
    404,
  );
});
