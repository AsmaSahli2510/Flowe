import { fail } from "../utils/http.js";
export function requireAuth(req, res, next) {
  if (!req.session.userId)
    return next(Object.assign(new Error("Please sign in"), { status: 401 }));
  next();
}
export function originGuard(req, res, next) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
    req.get("origin") !== (process.env.FRONTEND_URL || "http://localhost:5173")
  )
    return next(
      Object.assign(new Error("Request origin rejected"), { status: 403 }),
    );
  next();
}
export function objectId(req, res, next, value) {
  if (!/^[a-f0-9]{24}$/i.test(value)) fail(400, "Invalid identifier");
  next();
}
