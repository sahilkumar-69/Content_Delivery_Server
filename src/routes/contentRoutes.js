import { Router } from "express";
import {
  createContent,
  getLiveContentByTeacher,
  getMyContent,
} from "../controllers/contentController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { uploadContentFile } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  requireRole("teacher"),
  uploadContentFile.single("file"),
  createContent,
);

router.get("/my", requireAuth, requireRole("teacher"), getMyContent);

router.get("/live/:teacher", getLiveContentByTeacher);

export default router;
