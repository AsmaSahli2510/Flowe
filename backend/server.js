import { createServer } from "node:http";
import { attachRealtime } from "./realtime.js";
import { validateEnv } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { startMailWorker } from "./services/mail.js";
import mongoose from "mongoose";
import { tickAutomations } from "./services/automationScheduler.js";
validateEnv();
await connectDatabase();
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const app = createApp();
const server = createServer(app);
attachRealtime(server, app);
server.listen(Number(process.env.PORT || 4000), () =>
  console.log("Flowe API listening on port " + (process.env.PORT || 4000)),
);
const worker = startMailWorker();
const automationWorker = setInterval(() => tickAutomations(app.locals.io).catch(e => console.error('Automation worker:',e.message)), 60000);
automationWorker.unref();
tickAutomations(app.locals.io).catch(e=>console.error('Automation worker:',e.message));
async function shutdown() {
  clearInterval(worker);
  clearInterval(automationWorker);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
