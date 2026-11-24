import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  email,
  string,
  fail,
  publicUser,
  regenerate,
  saveSession,
} from "../utils/http.js";
import { welcome } from "../services/mail.js";
export async function establish(req, user, remember = true) {
  await regenerate(req);
  req.session.userId = String(user._id);
  req.session.cookie.maxAge = remember ? 7 * 86400000 : null;
  await saveSession(req);
}
export async function signup(req, res) {
  const name = string(req.body.name, "Name");
  const address = email(req.body.email);
  const password = req.body.password;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  )
    fail(
      400,
      "Use a password with 8 characters or more (maximum 72 UTF-8 bytes)",
    );
  if (await User.exists({ email: address }))
    fail(409, "An account already exists for this email");
  const user = await User.create({
    name,
    email: address,
    passwordHash: await bcrypt.hash(password, 12),
  });
  await welcome(user);
  await establish(req, user);
  res.status(201).json({ user: publicUser(user) });
}
export async function login(req, res) {
  const address = email(req.body.email);
  const password = req.body.password;
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72)
    fail(401, "Email or password incorrect");
  const user = await User.findOne({ email: address }).select("+passwordHash");
  if (
    !user?.passwordHash ||
    !(await bcrypt.compare(password, user.passwordHash))
  )
    fail(401, "Email or password incorrect");
  await welcome(user);
  await establish(req, user, req.body.remember !== false);
  res.json({ user: publicUser(user) });
}
export async function me(req, res) {
  const user = await User.findById(req.session.userId);
  if (!user) fail(401, "Please sign in");
  res.json({ user: publicUser(user) });
}
export function logout(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("flowe.sid", { path: "/" });
    res.status(204).end();
  });
}
