import Workspace from "../models/Workspace.js";
import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { createHash, randomBytes } from "node:crypto";
import { email, string, fail } from "../utils/http.js";
import { queueInvitation } from "../services/mail.js";
import { frontendURL } from "../config/env.js";
const hash = (t) => createHash("sha256").update(t).digest("hex");
export async function list(req, res) {
  res.json({
    workspaces: await Workspace.find({
      "members.user": req.session.userId,
    }).sort({ createdAt: 1 }),
  });
}
export async function create(req, res) {
  const workspace = await Workspace.create({
    name: string(req.body.name, "Workspace name"),
    description:
      typeof req.body.description === "string"
        ? req.body.description.slice(0, 500)
        : "",
    owner: req.session.userId,
    members: [{ user: req.session.userId, role: "owner" }],
  });
  res.status(201).json({ workspace });
}
export async function members(req, res) {
  await req.workspace.populate("members.user", "name email");
  res.json({ members: req.workspace.members, owner: req.workspace.owner });
}
export async function invite(req, res) {
  const address = email(req.body.email);
  const users = await User.find({ email: address });
  if (
    users.some((u) =>
      req.workspace.members.some((m) => String(m.user) === String(u._id)),
    )
  )
    fail(409, "This person is already a member");
  const pending = await Invitation.findOne({ workspace: req.workspace._id, email: address,
    acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } });
  if (pending) fail(409, "An invitation for this email is already pending. Revoke it before sending a new one.");
  const token = randomBytes(32).toString("hex");
  const invitation = await Invitation.create({
    workspace: req.workspace._id,
    email: address,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + 7 * 86400000),
    invitedBy: req.session.userId,
  });
  const url = frontendURL() + "/invite/" + token;
  await queueInvitation(invitation, req.workspace, url);
  // Users who already have a Flowe account get an in-app notification.
  // New users still receive the invitation by email and can sign up first.
  const inviter = await User.findById(req.session.userId).select("name");
  for (const recipient of users) {
    const note = await Notification.create({ user: String(recipient._id),
      workspace: String(req.workspace._id), actor: inviter?.name || "A teammate", kind: "invitation",
      text: `${inviter?.name || "A teammate"} invited you to ${req.workspace.name}. Open your email to accept.` });
    req.app.locals.io?.to("u:" + recipient._id).emit("notification", note);
  }
  res.status(201).json({
    url,
    expiresAt: invitation.expiresAt,
    message: "Invitation created; email queued for delivery",
  });
}
export async function resend(req,res){
  const invitation=await Invitation.findOne({_id:req.params.id,workspace:req.workspace._id,
    acceptedAt:null,revokedAt:null,expiresAt:{$gt:new Date()}});
  if(!invitation)fail(404,'Pending invitation not found');
  const token=randomBytes(32).toString('hex');
  invitation.tokenHash=hash(token);
  invitation.expiresAt=new Date(Date.now()+7*86400000);
  await invitation.save();
  const url=frontendURL()+'/invite/'+token;
  await queueInvitation(invitation,req.workspace,url);
  const target=await User.findOne({email:invitation.email}).select('name');
  if(target){
    const note=await Notification.create({user:String(target._id),workspace:String(req.workspace._id),
      actor:'Flowe',kind:'invitation',text:`Reminder: your invitation to ${req.workspace.name} is waiting for you.`});
    req.app.locals.io?.to('u:'+target._id).emit('notification',note);
  }
  res.json({message:'Invitation resent',expiresAt:invitation.expiresAt,url});
}
export async function preview(req, res) {
  if (!/^[a-f0-9]{64}$/.test(req.params.token))
    fail(404, "Invitation not found");
  const invitation = await Invitation.findOne({
    tokenHash: hash(req.params.token),
    expiresAt: { $gt: new Date() },
    acceptedAt: null,
    revokedAt: null,
  }).populate("workspace", "name");
  if (!invitation?.workspace)
    fail(404, "Invitation expired or already accepted");
  res.json({
    workspaceName: invitation.workspace.name,
    expiresAt: invitation.expiresAt,
  });
}
async function finishAcceptance(req, res, invitation) {
  const user = await User.findById(req.session.userId);
  if (!invitation) fail(404, "Invitation expired, revoked or already accepted");
  if (!user || user.email !== invitation.email)
    fail(403, "Sign in with the email address that received the invitation");
  const workspace = await Workspace.findById(invitation.workspace);
  if (!workspace) fail(404, "Workspace not found");
  // Only one request may consume a pending invitation (including across devices).
  const accepted = await Invitation.findOneAndUpdate({ _id: invitation._id,
    acceptedAt: null, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { acceptedAt: new Date() } }, { new: true });
  if (!accepted) fail(409, "This invitation was already processed");
  await Workspace.updateOne(
    { _id: workspace._id, "members.user": { $ne: user._id } },
    { $push: { members: { user: user._id, role: "member" } } },
  );
  const inviterId = String(invitation.invitedBy);
  if (inviterId !== String(user._id)) {
    const note = await Notification.create({ user: inviterId, workspace: String(workspace._id),
      actor: user.name, kind: "invitation_accepted",
      text: `${user.name} accepted your invitation to ${workspace.name}.` });
    req.app.locals.io?.to("u:" + inviterId).emit("notification", note);
  }
  req.app.locals.io?.to("w:" + workspace._id).emit("workspaceMembersChanged", { workspace: String(workspace._id) });
  res.json({ workspaceId: workspace._id, workspaceName: workspace.name });
}
export async function accept(req, res) {
  if (!/^[a-f0-9]{64}$/.test(req.params.token)) fail(404, "Invitation not found");
  const invitation = await Invitation.findOne({tokenHash:hash(req.params.token),
    expiresAt:{$gt:new Date()}, acceptedAt:null, revokedAt:null});
  return finishAcceptance(req,res,invitation);
}
export async function received(req,res) {
  const user=await User.findById(req.session.userId).select('email');
  const invitations=await Invitation.find({email:user.email,acceptedAt:null,revokedAt:null,expiresAt:{$gt:new Date()}})
    .populate('workspace','name').select('workspace invitedBy createdAt expiresAt').sort({createdAt:-1});
  res.json({invitations:invitations.filter(i=>i.workspace)});
}
export async function acceptReceived(req,res) {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) fail(404,'Invitation not found');
  const invitation=await Invitation.findOne({_id:req.params.id,acceptedAt:null,revokedAt:null,
    expiresAt:{$gt:new Date()}});
  return finishAcceptance(req,res,invitation);
}
