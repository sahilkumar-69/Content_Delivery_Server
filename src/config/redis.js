import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisClient = createClient({ url: redisUrl });
let redisReady = false;

redisClient.on("error", (error) => {
  redisReady = false;
  console.error("Redis error:", error.message);
});

redisClient.on("ready", () => {
  redisReady = true;
  console.log("Redis connected ");
});

export const connectRedis = async () => {
  if (redisClient.isOpen) {
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    redisReady = false;
    console.warn("Redis unavailable. Continuing without cache support.");
  }
};

export const isRedisReady = () => redisReady && redisClient.isReady;
