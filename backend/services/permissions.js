import Project from "../models/Project.js";
import Workspace from "../models/Workspace.js";
import { fail } from "../utils/http.js";
export function canRead(p, w, uid) {
  return (
    String(w.owner) === String(uid) ||
    String(p.createdBy) === String(uid) ||
    p.visibility !== "Private" ||
    p.members.includes(String(uid))
  );
}
export function canManage(p, w, uid) {
  return String(w.owner) === String(uid) || String(p.createdBy) === String(uid);
}
export function canWrite(w, uid) {
  return w.members.some(
    (m) => String(m.user) === String(uid) && m.role !== "reader",
  );
}
export async function projectAccess(workspace, project, uid, write = false) {
  const w = await Workspace.findOne({ _id: workspace, "members.user": uid });
  const p = await Project.findOne({ _id: project, workspace });
  if (!w || !p || !canRead(p, w, uid)) fail(404, "Project unavailable");
  if (write && (!canWrite(w, uid) || p.archived))
    fail(403, "This project is read-only");
  return { p, w };
}
export async function evictProject(io, id) {
  if (!io) return;
  for (const s of await io.in("p:" + id).fetchSockets()) {
    try {
      await projectAccess(s.data.workspace, id, String(s.data.user._id));
    } catch {
      s.emit("accessRevoked");
      s.disconnect(true);
    }
  }
}
