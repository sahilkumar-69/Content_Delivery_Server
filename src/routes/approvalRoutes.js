import { Router } from "express";
import {
  getPendingContent,
  reviewContent,
} from "../controllers/approvalController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = Router();

router.get(
  "/:status",
  requireAuth,
  requireRole("principal"),
  getPendingContent,
);
router.patch(
  "/:id/review",
  requireAuth,
  requireRole("principal"),
  reviewContent,
);

export default router;
