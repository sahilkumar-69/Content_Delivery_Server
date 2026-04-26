import "dotenv/config";
import express from "express";
import { checkDatabaseConnection } from "./config/db.js";
import { initializeDatabase } from "./config/initDb.js";
import authRoutes from "./routes/authRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/errorMiddleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/health", async (req, res) => {
  const isDatabaseConnected = await checkDatabaseConnection();

  res.status(200).json({
    status: "ok",
    database: isDatabaseConnected ? "connected" : "disconnected",
    message: "Content delivery backend is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to the Content Delivery Backend API");
});

app.use("/api/auth", authRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/approval", approvalRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});

export default app;
