export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export function string(value, label, max = 80) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label}: 1–${max} characters required`);
  return value.trim();
}
export function email(value) {
  const result = string(value, "Email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "Enter a valid email");
  return result;
}
export function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}
export const saveSession = (req) =>
  new Promise((resolve, reject) =>
    req.session.save((e) => (e ? reject(e) : resolve())),
  );
export const regenerate = (req) =>
  new Promise((resolve, reject) =>
    req.session.regenerate((e) => (e ? reject(e) : resolve())),
  );
