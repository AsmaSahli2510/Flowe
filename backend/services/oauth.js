import { createHash, randomBytes } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { apiURL } from "../config/env.js";
import { fail } from "../utils/http.js";
const configs = {
  google: {
    authorization: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    jwks: "https://www.googleapis.com/oauth2/v3/certs",
  },
  outlook: {
    authorization:
      "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
    token: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    jwks: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
  },
};
const keys = Object.fromEntries(
  Object.entries(configs).map(([p, c]) => [
    p,
    createRemoteJWKSet(new URL(c.jwks)),
  ]),
);
export const random = () => randomBytes(32).toString("base64url");
export function providerConfig(provider) {
  const c = configs[provider];
  if (!c) fail(404, "Unknown provider");
  const prefix = provider === "google" ? "GOOGLE" : "MICROSOFT";
  const clientId = process.env[prefix + "_CLIENT_ID"],
    clientSecret = process.env[prefix + "_CLIENT_SECRET"];
  if (!clientId || !clientSecret)
    fail(503, `${provider} sign-in is not configured yet`);
  return {
    ...c,
    clientId,
    clientSecret,
    redirect: apiURL() + `/api/auth/${provider}/callback`,
  };
}
export function authorization(provider, flow) {
  const c = providerConfig(provider);
  const url = new URL(c.authorization);
  url.search = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: c.redirect,
    response_type: "code",
    scope: "openid profile email",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: createHash("sha256")
      .update(flow.verifier)
      .digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return url.href;
}
export async function exchange(provider, code, flow) {
  const c = providerConfig(provider);
  const response = await fetch(c.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      code,
      redirect_uri: c.redirect,
      grant_type: "authorization_code",
      code_verifier: flow.verifier,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) fail(401, "Provider authentication failed");
  const tokens = await response.json();
  const { payload } = await jwtVerify(tokens.id_token, keys[provider], {
    audience: c.clientId,
    algorithms: ["RS256"],
    ...(provider === "google"
      ? { issuer: ["https://accounts.google.com", "accounts.google.com"] }
      : {}),
  });
  if (payload.nonce !== flow.nonce || !payload.sub)
    fail(401, "Invalid authentication response");
  if (
    provider === "outlook" &&
    (payload.tid !== "9188040d-6c67-4c5b-b112-36a304b66dad" ||
      payload.iss !== `https://login.microsoftonline.com/${payload.tid}/v2.0`)
  )
    fail(401, "Invalid Microsoft issuer");
  return payload;
}
