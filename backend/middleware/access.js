import Workspace from "../models/Workspace.js";
import { fail } from "../utils/http.js";
export async function workspaceAccess(req, res, next) {
  const workspace = await Workspace.findOne({
    _id: req.params.workspaceId,
    "members.user": req.session.userId,
  });
  if (!workspace) fail(404, "Workspace not found");
  req.workspace = workspace;
  next();
}
export function ownerOnly(req, res, next) {
  if (String(req.workspace.owner) !== req.session.userId)
    fail(403, "Only the workspace owner can invite people");
  next();
}
