import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import EmailJob from "../models/EmailJob.js";
import User from "../models/User.js";
import { frontendURL } from "../config/env.js";
const logoPath = fileURLToPath(
  new URL("../../frontend/src/images/logoTransparent.png", import.meta.url),
);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function emailFrame({ eyebrow, title, body, cta, url }) {
  return `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f5f2ee;color:#242724;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ee"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e8e2dc;border-radius:18px;overflow:hidden"><tr><td style="padding:26px 36px;border-bottom:1px solid #eee9e4"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="vertical-align:middle"><img src="cid:flowe-logo" width="42" height="42" alt="Flowe" style="display:block;object-fit:contain"></td><td style="padding-left:12px;font-size:25px;font-weight:700;letter-spacing:-1px;vertical-align:middle">flowe<span style="color:#c184a5">.</span></td></tr></table></td></tr><tr><td style="padding:42px 36px 36px"><p style="margin:0 0 14px;color:#8b638c;letter-spacing:2px;font-size:10px;font-weight:700">${escape(eyebrow)}</p><h1 style="margin:0 0 20px;font-size:34px;line-height:1.15;letter-spacing:-1px;font-weight:700">${escape(title)}</h1><div style="height:4px;width:48px;margin-bottom:24px;background:#c184a5;border-radius:4px"></div><p style="margin:0;font-size:16px;line-height:1.75;color:#68616b">${escape(body)}</p><p style="margin:30px 0 8px"><a href="${escape(url)}" style="display:inline-block;padding:14px 22px;background:#242724;border-radius:9px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700">${escape(cta)}</a></p><p style="margin:0;font-size:12px;color:#918a84">You can access your workspace securely from this button.</p></td></tr><tr><td style="padding:22px 36px;background:#faf8f6;border-top:1px solid #eee9e4"><p style="margin:0;color:#837a83;font-size:12px;line-height:1.7">A little more flow. A lot more room to bloom.<br><span style="color:#aaa29b">Made for minds that make things.</span></p></td></tr></table><p style="margin:18px 0 0;color:#aaa29b;font-size:11px">© Flowe · This is an automated message</p></td></tr></table></body></html>`;
}
export async function welcome(user) {
  const args = {
    eyebrow: "YOUR NEXT CHAPTER STARTS HERE",
    title: `Make room for great things, ${user.name}.`,
    body: "One idea is all it takes. Plant your first workspace, give your project a rhythm, and invite your people whenever you are ready. Your space to bloom is waiting.",
    cta: "Plant my first workspace",
    url: frontendURL() + "/workspace",
  };
  await EmailJob.updateOne(
    { key: `welcome:${user._id}` },
    {
      $setOnInsert: {
        to: user.email,
        subject: "Your ideas have a new home - Welcome to Flowe",
        html: emailFrame(args),
        text: args.title + " " + args.body + " " + args.url,
      },
    },
    { upsert: true },
  );
}
export async function queueInvitation(invitation, workspace, url) {
  const args = {
    eyebrow: "GOOD THINGS GROW TOGETHER",
    title: `A place for you in ${workspace.name}.`,
    body: `${(await User.findById(invitation.invitedBy))?.name || "A teammate"} invited you to collaborate in this Flowe workspace. Sign in with this email address to accept. This invitation is valid for 7 days.`,
    cta: "Join the garden",
    url,
  };
  await EmailJob.create({
    key: `invite:${invitation._id}`,
    to: invitation.email,
    subject: `You’re invited to ${workspace.name}`,
    html: emailFrame(args),
    text: args.body + " " + url,
  });
}
let running = false;
export async function processMail() {
  if (running || !process.env.SMTP_HOST) return;
  running = true;
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      ...(process.env.SMTP_USER
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } }
        : {}),
    });
    for (let i = 0; i < 10; i++) {
      const job = await EmailJob.findOneAndUpdate(
        {
          $or: [
            { status: "pending", nextAttempt: { $lte: new Date() } },
            {
              status: "sending",
              lockedAt: { $lt: new Date(Date.now() - 300000) },
            },
          ],
        },
        {
          $set: { status: "sending", lockedAt: new Date() },
          $inc: { attempts: 1 },
        },
        { new: true },
      );
      if (!job) break;
      try {
        await transport.sendMail({
          from: process.env.MAIL_FROM || "Flowe <hello@localhost>",
          to: job.to,
          subject: job.subject,
          html: job.html,
          text: job.text,
          attachments: [
            {
              filename: "flowe-logo.png",
              path: logoPath,
              cid: "flowe-logo",
              contentType: "image/png",
            },
          ],
          messageId: `<${job._id}@flowe.mail>`,
        });
        job.status = "sent";
        job.sentAt = new Date();
        await job.save();
        if (job.key.startsWith("welcome:"))
          await User.updateOne(
            { _id: job.key.split(":")[1] },
            { $set: { welcomeSentAt: new Date() } },
          );
      } catch {
        job.status = "pending";
        job.nextAttempt = new Date(
          Date.now() +
            Math.min(3600000, 30000 * 2 ** Math.min(job.attempts, 7)),
        );
        await job.save();
        console.error("Email delivery failed; queued for retry");
      }
    }
  } finally {
    running = false;
  }
}
export function startMailWorker() {
  void processMail().catch(() => console.error("Mail worker unavailable"));
  return setInterval(
    () =>
      void processMail().catch(() => console.error("Mail worker unavailable")),
    15000,
  );
}
