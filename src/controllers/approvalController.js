import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPendingContent = asyncHandler(async (_req, res) => {
  const { status } = _req.params;

  if (!["pending", "approved", "rejected", "all"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const result = await query(
    `
      SELECT
        c.id,
        c.title,
        c.description,
        c.subject,
        c.status,
        c.rejection_reason,
        c.file_path,
        c.file_type,
        c.file_size,
        c.start_time,
        c.end_time,
        c.created_at,
        u.id AS uploaded_by,
        u.name AS uploaded_by_name,
        u.email AS uploaded_by_email,
        cs.rotation_order,
        cs.duration_seconds
      FROM content c
      JOIN users u ON u.id = c.uploaded_by
      LEFT JOIN content_slots s ON s.subject = c.subject
      LEFT JOIN content_schedule cs ON cs.content_id = c.id AND cs.slot_id = s.id
      ${status === "all" ? "" : "WHERE c.status = $1"}
      ORDER BY c.created_at ASC
    `,
    status === "all" ? [] : [status],
  );

  return res.status(200).json({ [status]: result.rows });
});

export const reviewContent = asyncHandler(async (req, res) => {
  const contentId = Number(req.params.id);
  const { action, rejection_reason } = req.body;

  if (!Number.isInteger(contentId) || contentId <= 0) {
    return res.status(400).json({ message: "Invalid content id" });
  }

  if (!["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ message: "action must be approve or reject" });
  }

  if (action === "reject" && !rejection_reason) {
    return res
      .status(400)
      .json({ message: "rejection_reason is required for rejection" });
  }

  const exists = await query("SELECT id, status FROM content WHERE id = $1", [
    contentId,
  ]);
  if (exists.rowCount === 0) {
    return res.status(404).json({ message: "Content not found" });
  }

  if (exists.rows[0].status !== "pending") {
    return res
      .status(409)
      .json({ message: "Only pending content can be reviewed" });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const result = await query(
    `
      UPDATE content
      SET
        status = $1,
        rejection_reason = $2,
        approved_by = $3,
        approved_at = NOW()
      WHERE id = $4
      RETURNING id, status, rejection_reason, approved_by, approved_at
    `,
    [
      newStatus,
      action === "reject" ? rejection_reason : null,
      req.user.id,
      contentId,
    ],
  );

  return res.status(200).json({
    message: `Content ${newStatus}`,
    content: result.rows[0],
  });
});
