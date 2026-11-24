import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController.js";
import * as oauth from "../controllers/oauthController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
const limit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});
router.post("/signup", limit, auth.signup);
router.post("/login", limit, auth.login);
router.get("/me", requireAuth, auth.me);
router.post("/logout", auth.logout);
router.get("/:provider/callback", limit, oauth.callback);
router.get("/:provider", limit, oauth.start);
export default router;
