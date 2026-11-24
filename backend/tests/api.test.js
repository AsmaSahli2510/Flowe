import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import session from "express-session";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";
import EmailJob from "../models/EmailJob.js";
import { emailFrame, processMail } from "../services/mail.js";
import net from "node:net";
let mongo, app, owner, member, outsider, workspace, project, invitation;
const origin = "http://localhost:5173";
function post(agent, path, body) {
  return agent
    .post("/api" + path)
    .set("Origin", origin)
    .send(body);
}
before(async () => {
  process.env.SESSION_SECRET = "test-only-secret-at-least-32-characters-long";
  process.env.FRONTEND_URL = origin;
  mongo = await MongoMemoryServer.create({
    instance: { args: ["--nounixsocket"] },
  });
  await mongoose.connect(mongo.getUri());
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app = createApp({ store: new session.MemoryStore() });
  owner = request.agent(app);
  member = request.agent(app);
  outsider = request.agent(app);
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
test("rejects anonymous access and foreign origins", async () => {
  assert.equal((await request(app).get("/api/workspaces")).status, 401);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/signup")
        .set("Origin", "https://evil.example")
        .send({})
    ).status,
    403,
  );
});
test("registration validates input, hashes password, queues welcome once and creates session", async () => {
  assert.equal(
    (
      await post(owner, "/auth/signup", {
        name: "Ada",
        email: "ada@example.com",
        password: "short",
      })
    ).status,
    400,
  );
  const res = await post(owner, "/auth/signup", {
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "correct-horse-battery",
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.passwordHash, undefined);
  const u = await User.findOne({ email: "ada@example.com" }).select(
    "+passwordHash",
  );
  assert.notEqual(u.passwordHash, "correct-horse-battery");
  assert.equal(await EmailJob.countDocuments({ key: `welcome:${u.id}` }), 1);
  assert.equal((await owner.get("/api/auth/me")).status, 200);
  assert.equal(
    (
      await post(owner, "/auth/signup", {
        name: "Ada",
        email: u.email,
        password: "abcdefgh",
      })
    ).status,
    409,
  );
});
test("login rejects wrong password, normalizes email, rotates session", async () => {
  assert.equal(
    (
      await post(outsider, "/auth/login", {
        email: "ada@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await post(owner, "/auth/login", {
        email: " ADA@EXAMPLE.COM ",
        password: "correct-horse-battery",
      })
    ).status,
    200,
  );
  assert.equal(await EmailJob.countDocuments({ to: "ada@example.com" }), 1);
});
test("workspace starts with owner only; multiple workspaces are isolated", async () => {
  const res = await post(owner, "/workspaces", {
    name: "Design garden",
    description: "A creative home",
  });
  assert.equal(res.status, 201);
  workspace = res.body.workspace;
  assert.equal(workspace.members.length, 1);
  assert.equal(
    (await post(owner, "/workspaces", { name: "Personal garden" })).status,
    201,
  );
  await post(member, "/auth/signup", {
    name: "Grace",
    email: "grace@example.com",
    password: "securepassword",
  });
  await post(outsider, "/auth/signup", {
    name: "Alan",
    email: "alan@example.com",
    password: "securepassword",
  });
  assert.equal((await member.get("/api/workspaces")).body.workspaces.length, 0);
  assert.equal(
    (await member.get(`/api/workspaces/${workspace._id}/projects`)).status,
    404,
  );
});
test("templates and project creation persist exact columns; invalid templates rejected", async () => {
  assert.equal((await owner.get("/api/templates")).body.templates.length, 3);
  let res = await post(owner, `/workspaces/${workspace._id}/projects`, {
    name: "Sprint one",
    template: "scrum",
  });
  assert.equal(res.status, 201);
  project = res.body.project;
  assert.deepEqual(
    project.lists.map((l) => l.title),
    ["Product backlog", "Sprint backlog", "In progress", "Review", "Done"],
  );
  res = await post(owner, `/workspaces/${workspace._id}/projects`, {
    name: "Study",
    template: "study",
  });
  assert.equal(res.body.project.lists.length, 4);
  res = await post(owner, `/workspaces/${workspace._id}/projects`, {
    name: "Custom",
    template: "custom",
    columns: ["Think", "Make", "Share"],
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.project.lists[2].title, "Share");
  assert.equal(
    (
      await post(owner, `/workspaces/${workspace._id}/projects`, {
        name: "Invalid",
        template: "custom",
        columns: [],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await post(owner, `/workspaces/${workspace._id}/projects`, {
        name: "Invalid",
        template: "invented",
      })
    ).status,
    400,
  );
});
test("invitations are owner-only, hashed, email-bound and single use", async () => {
  assert.equal(
    (
      await post(member, `/workspaces/${workspace._id}/invitations`, {
        email: "alan@example.com",
      })
    ).status,
    404,
  );
  const res = await post(owner, `/workspaces/${workspace._id}/invitations`, {
    email: "grace@example.com",
  });
  assert.equal(res.status, 201);
  invitation = res.body.url.split("/").pop();
  const stored = await Invitation.findOne({ email: "grace@example.com" });
  assert.notEqual(stored.tokenHash, invitation);
  assert.equal(
    (await request(app).get("/api/invitations/" + invitation)).body
      .workspaceName,
    "Design garden",
  );
  assert.equal(
    (await post(outsider, `/invitations/${invitation}/accept`, {})).status,
    403,
  );
  assert.equal(
    (await post(member, `/invitations/${invitation}/accept`, {})).status,
    200,
  );
  assert.equal(
    (await post(member, `/invitations/${invitation}/accept`, {})).status,
    404,
  );
  assert.equal(
    (await member.get(`/api/workspaces/${workspace._id}/members`)).body.members
      .length,
    2,
  );
  assert.equal(
    (
      await post(member, `/workspaces/${workspace._id}/invitations`, {
        email: "alan@example.com",
      })
    ).status,
    403,
  );
});
test("members collaborate; revision conflicts prevent overwriting; outsiders cannot write", async () => {
  const path = `/api/workspaces/${workspace._id}/projects/${project._id}`;
  const lists = project.lists;
  lists[0].cards.push({
    id: 50,
    title: "First idea",
    detail: "Context",
    checks: 0,
    done: 0,
  });
  let res = await owner
    .patch(path)
    .set("Origin", origin)
    .send({ lists, revision: 0 });
  assert.equal(res.status, 200);
  assert.equal(res.body.project.revision, 1);
  assert.equal(
    (
      await member
        .patch(path)
        .set("Origin", origin)
        .send({ name: "Stale write", revision: 0 })
    ).status,
    409,
  );
  res = await member
    .patch(path)
    .set("Origin", origin)
    .send({ name: "Team sprint", revision: 1 });
  assert.equal(res.status, 200);
  assert.equal(
    (
      await outsider
        .patch(path)
        .set("Origin", origin)
        .send({ name: "Attack", revision: 2 })
    ).status,
    404,
  );
  assert.equal(
    (
      await owner.get(`/api/workspaces/${workspace._id}/projects`)
    ).body.projects.find((p) => p._id === project._id).lists[0].cards[0].title,
    "First idea",
  );
});
test("expired invitations cannot be accepted", async () => {
  const res = await post(owner, `/workspaces/${workspace._id}/invitations`, {
    email: "alan@example.com",
  });
  const token = res.body.url.split("/").pop();
  await Invitation.updateOne(
    { email: "alan@example.com" },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );
  assert.equal(
    (await post(outsider, `/invitations/${token}/accept`, {})).status,
    404,
  );
});
test("OAuth rejects unavailable providers and forged callback state", async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  assert.equal((await owner.get("/api/auth/google")).status, 503);
  const res = await owner.get(
    "/api/auth/google/callback?state=forged&code=bogus",
  );
  assert.equal(res.status, 302);
  assert.match(res.headers.location, /error=/);
});
test("welcome HTML escapes user content", () => {
  const html = emailFrame({
    eyebrow: "Welcome",
    title: "<script>alert(1)</script>",
    body: "Hi & hello",
    cta: "Start",
    url: "https://example.com",
  });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});
test("logout revokes server session", async () => {
  assert.equal((await post(owner, "/auth/logout", {})).status, 204);
  assert.equal((await owner.get("/api/auth/me")).status, 401);
});

test("SMTP worker delivers queued emails and records welcome timestamp", async () => {
  const delivered = [];
  const smtp = net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.write("220 local-test SMTP ready\r\n");
    let buffer = "",
      data = false,
      message = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (data) {
          if (line === ".") {
            delivered.push(message);
            message = "";
            data = false;
            socket.write("250 Message accepted\r\n");
          } else {
            message += line + "\r\n";
          }
          continue;
        }
        if (/^EHLO|^HELO/.test(line)) socket.write("250 local-test\r\n");
        else if (/^MAIL FROM:|^RCPT TO:/.test(line)) socket.write("250 OK\r\n");
        else if (line === "DATA") {
          data = true;
          socket.write("354 End with dot\r\n");
        } else if (line === "QUIT") {
          socket.end("221 Bye\r\n");
        } else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise((resolve) => smtp.listen(0, "127.0.0.1", resolve));
  process.env.SMTP_HOST = "127.0.0.1";
  process.env.SMTP_PORT = String(smtp.address().port);
  process.env.MAIL_FROM = "Flowe <hello@example.com>";
  try {
    const pending = await EmailJob.countDocuments({ status: "pending" });
    await processMail();
    assert.equal(delivered.length, pending);
    assert.ok(
      delivered.some(
        (m) =>
          m.includes("ada@example.com") && m.includes("multipart/alternative"),
      ),
    );
    assert.equal(await EmailJob.countDocuments({ status: "pending" }), 0);
    assert.ok((await User.findOne({ email: "ada@example.com" })).welcomeSentAt);
    await processMail();
    assert.equal(delivered.length, pending);
  } finally {
    delete process.env.SMTP_HOST;
    await new Promise((resolve) => smtp.close(resolve));
  }
});
