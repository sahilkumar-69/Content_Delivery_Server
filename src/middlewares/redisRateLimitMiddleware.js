import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { connectRedis, isRedisReady, redisClient } from "../config/redis.js";

const windowMs = Number(process.env.LIVE_RATE_LIMIT_WINDOW_MS || 60_000);
const maxRequests = Number(process.env.LIVE_RATE_LIMIT_MAX || 30);

const responseMessage = {
  message: "Too many requests for live content. Please try again shortly.",
};

const fallbackLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: responseMessage,
});

const sendRedisCommand = async (...args) => {
  if (!redisClient.isOpen) {
    await connectRedis();
  }

  return redisClient.sendCommand(args);
};

const redisLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  message: responseMessage,
  store: new RedisStore({
    sendCommand: (...args) => sendRedisCommand(...args),
  }),
});

export const liveEndpointRateLimiter = (req, res, next) => {
  if (isRedisReady()) {
    return redisLimiter(req, res, next);
  }

  return fallbackLimiter(req, res, next);
};
