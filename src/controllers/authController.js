import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validRoles = ["principal", "teacher"];

export const register = asyncHandler(async (req, res) => {
  let { name, email, password, role } = req.body;

  name = name?.trim();
  email = email?.trim();
  password = password;
  role = role?.trim();

  if (!name || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "name, email, password, and role are required" });
  }

  if (!validRoles.includes(role)) {
    return res
      .status(400)
      .json({ message: "role must be principal or teacher" });
  }

  const existingUser = await query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (existingUser.rowCount > 0) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at
    `,
    [name, email.toLowerCase(), passwordHash, role],
  );

  return res.status(201).json({ user: result.rows[0], success: true });
});

export const login = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  email = email?.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const result = await query(
    "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()],
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
  );

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    success: true,
  });
});
