import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import session from "express-session";
import request from "supertest";
import { createServer } from "node:http";
import { io } from "../../frontend/node_modules/socket.io-client/build/esm/index.js";
import { createApp } from "../app.js";
import { attachRealtime } from "../realtime.js";
test("authenticated sockets: multi-session presence, durable conversation, outsiders rejected", async () => {
  process.env.SESSION_SECRET =
    "test-only-long-session-secret-for-flowe-realtime";
  process.env.FRONTEND_URL = "http://localhost:5173";
  const mongo = await MongoMemoryServer.create({
    instance: { args: ["--nounixsocket"] },
  });
  await mongoose.connect(mongo.getUri());
  const app = createApp({ store: new session.MemoryStore() });
  const http = createServer(app);
  const realtime = attachRealtime(http, app);
  await new Promise((r) => http.listen(0, "127.0.0.1", r));
  const clients = [];
  try {
    const accounts = [];
    for (const name of ["Alice", "Bob", "Other"]) {
      const a = request.agent(app);
      const res = await a
        .post("/api/auth/signup")
        .set("Origin", process.env.FRONTEND_URL)
        .send({ name, email: name + "@example.com", password: "password123" });
      accounts.push({
        a,
        id: res.body.user.id,
        cookie: res.headers["set-cookie"][0].split(";")[0],
      });
    }
    const w = (
      await accounts[0].a
        .post("/api/workspaces")
        .set("Origin", process.env.FRONTEND_URL)
        .send({ name: "Team" })
    ).body.workspace;
    await mongoose
      .model("Workspace")
      .updateOne(
        { _id: w._id },
        { $push: { members: { user: accounts[1].id, role: "member" } } },
      );
    async function connect(a) {
      const s = io("http://127.0.0.1:" + http.address().port, {
        extraHeaders: { Origin: process.env.FRONTEND_URL, Cookie: a.cookie },
        transports: ["websocket"],
      });
      clients.push(s);
      await new Promise((r, j) => {
        s.once("connect", r);
        s.once("connect_error", j);
      });
      return s;
    }
    const a = await connect(accounts[0]),
      a2 = await connect(accounts[0]),
      b = await connect(accounts[1]),
      other = await connect(accounts[2]);
    const call = (s, e, d) => s.timeout(3000).emitWithAck(e, d);
    let people = [];
    a.on("presence", (p) => (people = p));
    for (const s of [a, a2, b])
      assert.equal((await call(s, "join", { workspace: w._id })).ok, true);
    assert.equal(people.length, 2);
    assert.equal((await call(other, "join", { workspace: w._id })).ok, false);
    const c = await call(a, "createConversation", {
      participants: [accounts[1].id],
      name: "Together",
    });
    assert.equal(c.ok, true);
    const sent = await call(a, "send", {
      id: c.conversation._id,
      text: "Hello garden",
      clientId: "one",
    });
    assert.equal(sent.ok, true);
    assert.equal(
      (await call(b, "history", { id: c.conversation._id })).messages[0].text,
      "Hello garden",
    );
    assert.equal(
      (await call(b, "conversations", {})).conversations[0].unread,
      1,
    );
    await call(b, "read", { id: c.conversation._id });
    assert.equal(
      (await call(b, "conversations", {})).conversations[0].unread,
      0,
    );
    a2.disconnect();
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(people.length, 2);
  } finally {
    clients.forEach((s) => s.disconnect());
    await new Promise((r) => realtime.close(r));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
