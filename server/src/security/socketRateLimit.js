const buckets = new Map();

export function guardSocketRate(socket, key, limit = 20, windowMs = 10_000) {
  const now = Date.now();
  const bucketKey = `${socket.id}:${key}`;
  const bucket = buckets.get(bucketKey) ?? { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(bucketKey, bucket);

  if (bucket.count > limit) {
    throw new Error('Too many requests. Slow down for a moment.');
  }
}
