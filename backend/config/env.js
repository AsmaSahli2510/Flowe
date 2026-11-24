import "dotenv/config";
export function validateEnv() {
  for (const key of ["MONGODB_URI", "SESSION_SECRET"])
    if (!process.env[key]) throw new Error(`${key} is required`);
  if (process.env.SESSION_SECRET.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.PUBLIC_API_URL?.startsWith("https://") ||
      !process.env.FRONTEND_URL?.startsWith("https://"))
  )
    throw new Error("Production URLs must use HTTPS");
}
export const frontendURL = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";
export const apiURL = () =>
  process.env.PUBLIC_API_URL || "http://localhost:4000";
