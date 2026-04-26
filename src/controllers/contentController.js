import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { pickActiveContent } from "../services/rotationService.js";

const parseOptionalDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const createContent = asyncHandler(async (req, res) => {
  let { title, description, subject, start_time, end_time, rotation_duration } =
    req.body;

  title = title?.trim();
  subject = subject?.trim();
  description = description?.trim();

  if (!title || !subject) {
    return res.status(400).json({ message: "title and subject are required" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "file is required" });
  }

  const startTime = parseOptionalDate(start_time);
  const endTime = parseOptionalDate(end_time);

  if (start_time && !startTime) {
    return res
      .status(400)
      .json({ message: "start_time must be a valid datetime" });
  }

  if (end_time && !endTime) {
    return res
      .status(400)
      .json({ message: "end_time must be a valid datetime" });
  }

  if (startTime && endTime && startTime >= endTime) {
    return res
      .status(400)
      .json({ message: "end_time must be greater than start_time" });
  }

  const duration = Math.max(1, Number(rotation_duration || 30));

  await query("BEGIN");
  try {
    const contentInsert = await query(
      `
        INSERT INTO content (
          title, description, subject, file_path, file_type, file_size,
          uploaded_by, status, start_time, end_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
        RETURNING *
      `,
      [
        title,
        description || null,
        subject.trim().toLowerCase(),
        req.file.path.replaceAll("\\\\", "/"),
        req.file.mimetype,
        req.file.size,
        req.user.id,
        startTime,
        endTime,
      ],
    );

    const content = contentInsert.rows[0];

    const slotUpsert = await query(
      `
        INSERT INTO content_slots (subject)
        VALUES ($1)
        ON CONFLICT (subject)
        DO UPDATE SET subject = EXCLUDED.subject
        RETURNING id
      `,
      [content.subject],
    );

    const slotId = slotUpsert.rows[0].id;

    const orderQuery = await query(
      "SELECT COALESCE(MAX(rotation_order), 0) + 1 AS next_order FROM content_schedule WHERE slot_id = $1",
      [slotId],
    );

    const nextOrder = Number(orderQuery.rows[0].next_order);

    await query(
      `
        INSERT INTO content_schedule (content_id, slot_id, rotation_order, duration_seconds)
        VALUES ($1, $2, $3, $4)
      `,
      [content.id, slotId, nextOrder, duration],
    );

    await query("COMMIT");

    return res.status(201).json({
      message: "Content uploaded and pending approval",
      content,
    });
  } catch (error) {
    await query("ROLLBACK");
    throw error;
  }
});

export const getMyContent = asyncHandler(async (req, res) => {
  const result = await query(
    `
      SELECT
        c.id,
        c.title,
        c.subject,
        c.status,
        c.rejection_reason,
        c.start_time,
        c.end_time,
        c.created_at,
        cs.rotation_order,
        cs.duration_seconds
      FROM content c
      LEFT JOIN content_slots s ON s.subject = c.subject
      LEFT JOIN content_schedule cs ON cs.content_id = c.id AND cs.slot_id = s.id
      WHERE c.uploaded_by = $1
      ORDER BY c.created_at DESC
    `,
    [req.user.id],
  );

  return res.status(200).json({ content: result.rows });
});

export const getLiveContentByTeacher = asyncHandler(async (req, res) => {
  const teacher = (req.params.teacher || "").trim().toLowerCase();

  if (!teacher) {
    return res
      .status(200)
      .json({ message: "No content available", content: [] });
  }

  const result = await query(
    `
      SELECT
        c.id,
        c.title,
        c.description,
        c.subject,
        c.file_path,
        c.file_type,
        c.start_time,
        c.end_time,
        c.created_at,
        cs.duration_seconds,
        cs.rotation_order
      FROM content c
      JOIN content_slots s ON s.subject = c.subject
      JOIN content_schedule cs ON cs.content_id = c.id AND cs.slot_id = s.id
      WHERE c.status = 'approved'
        AND c.uploaded_by = $1
        AND (c.start_time IS NULL OR c.start_time <= NOW())
        AND (c.end_time IS NULL OR c.end_time >= NOW())
      ORDER BY cs.rotation_order ASC, c.id ASC
    `,
    [teacher],
  );

  const active = pickActiveContent(result.rows, new Date());

  if (!active) {
    return res
      .status(200)
      .json({ message: "No content available", content: [] });
  }

  return res.status(200).json({
    content: {
      id: active.id,
      title: active.title,
      description: active.description,
      subject: active.subject,
      file_url: `/${active.file_path.replaceAll("\\\\", "/")}`,
      file_type: active.file_type,
      start_time: active.start_time,
      end_time: active.end_time,
      duration_seconds: active.duration_seconds,
      rotation_order: active.rotation_order,
    },
  });
});
