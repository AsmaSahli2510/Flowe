import User from "../models/User.js";
import { authorization, exchange, random } from "../services/oauth.js";
import { saveSession, fail, email } from "../utils/http.js";
import { establish } from "./authController.js";
import { welcome } from "../services/mail.js";
import { frontendURL } from "../config/env.js";
export async function start(req, res) {
  const provider = req.params.provider;
  const flow = {
    provider,
    state: random(),
    nonce: random(),
    verifier: random(),
    createdAt: Date.now(),
  };
  const url = authorization(provider, flow);
  req.session.oauth = flow;
  await saveSession(req);
  res.redirect(url);
}
export async function callback(req, res) {
  try {
    const provider = req.params.provider;
    const flow = req.session.oauth;
    delete req.session.oauth;
    await saveSession(req);
    if (
      !flow ||
      flow.provider !== provider ||
      req.query.state !== flow.state ||
      Date.now() - flow.createdAt > 600000 ||
      typeof req.query.code !== "string"
    )
      fail(401, "Invalid OAuth state");
    const claims = await exchange(provider, req.query.code, flow);
    let user = await User.findOne({
      identities: { $elemMatch: { provider, subject: claims.sub } },
    });
    if (!user) {
      // Never merge accounts solely by a matching email claim.
      if (provider === "google" && claims.email_verified !== true)
        fail(401, "A verified email is required");
      const address = email(claims.email);
      if (await User.exists({ email: address }))
        fail(
          409,
          "This email already has an account. Sign in using its original method.",
        );
      user = await User.create({
        name: String(claims.name || address.split("@")[0]).slice(0, 80),
        email: address,
        identities: [{ provider, subject: claims.sub }],
      });
    }
    await welcome(user);
    await establish(req, user);
    res.redirect(frontendURL() + "/workspace");
  } catch (error) {
    const message = error.status
      ? error.message
      : "Unable to sign in. Please try again.";
    res.redirect(frontendURL() + "/login?error=" + encodeURIComponent(message));
  }
}
