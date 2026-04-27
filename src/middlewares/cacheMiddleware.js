import { isRedisReady, redisClient } from "../config/redis.js";

const buildKey = (req) =>
  `cache:live:teacher:${String(req.params.teacher || "")}`;

export const cacheLiveTeacherResponse = (req, res, next) => {
    
  const ttlSeconds = Number(process.env.LIVE_CACHE_TTL_SECONDS || 10);

  if (!isRedisReady()) {
    return next();
  }

  const key = buildKey(req);

  redisClient
    .get(key)
    .then((cached) => {
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200) {
          redisClient
            .setEx(key, ttlSeconds, JSON.stringify(body))
            .catch(() => undefined);
        }

        return originalJson(body);
      };

      return next();
    })
    .catch(() => next());
};

export const invalidateTeacherLiveCache = async (teacherId) => {
  if (!teacherId || !isRedisReady()) {
    return;
  }

  const key = `cache:live:teacher:${teacherId}`;
  try {
    await redisClient.del(key);
  } catch (error) {
    // Cache invalidation failures should not block API flow.
  }
};
