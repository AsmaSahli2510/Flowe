import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { preview, accept, received, acceptReceived } from "../controllers/workspaceController.js";
const router = Router();
router.get("/received/list", requireAuth, received);
router.post("/received/:id/accept", requireAuth, acceptReceived);
router.get("/:token", preview);
router.post("/:token/accept", requireAuth, accept);
export default router;
