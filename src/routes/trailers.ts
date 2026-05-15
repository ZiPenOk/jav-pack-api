import { Hono } from "hono";
import { cache } from "hono/cache";

import { getAVWikiDBTrailer, getDMMTrailer, getJAVDatabaseTrailer } from "../services/trailer";
import { codeValidator } from "../validators/code";

const route = "trailers";
const trailers = new Hono<{ Bindings: CloudflareBindings }>().basePath(`/${route}`);

trailers.use(cache({ cacheName: route }));

trailers.get("/:code", codeValidator("param", "code"), async (c) => {
  const { code } = c.req.valid("param");
  const { TTL_HIT, TTL_MISS } = c.env;

  const key = `${route}:${code}`;
  let trailer = await c.env.KV.get(key, { cacheTtl: TTL_HIT });

  if (trailer === "") {
    c.header("Cache-Control", `public, max-age=${TTL_MISS}`);
    return c.json({ error: "Not Found" }, 404);
  }

  if (trailer) {
    c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
    return c.json({ trailer });
  }

  trailer = await c.env.DB.prepare("SELECT trailer FROM trailers WHERE code = ?").bind(code).first("trailer");

  if (trailer) {
    c.executionCtx.waitUntil(c.env.KV.put(key, trailer, { expirationTtl: TTL_HIT }));
    c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
    return c.json({ trailer });
  }

  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);

  try {
    const res = await Promise.any([
      getAVWikiDBTrailer(code, signal),
      getDMMTrailer(code, signal),
      getJAVDatabaseTrailer(code, signal),
    ]).finally(() => controller.abort());

    const { protocol, href } = new URL(res);
    if (!protocol.startsWith("http")) throw new Error();

    trailer = href;
  } catch {
    c.executionCtx.waitUntil(c.env.KV.put(key, "", { expirationTtl: TTL_MISS }));
    c.header("Cache-Control", `public, max-age=${TTL_MISS}`);
    return c.json({ error: "Not Found" }, 404);
  }

  c.executionCtx.waitUntil(
    Promise.allSettled([
      c.env.DB.prepare("INSERT OR IGNORE INTO trailers (code, trailer) VALUES (?, ?)").bind(code, trailer).run(),
      c.env.KV.put(key, trailer, { expirationTtl: TTL_HIT }),
    ]),
  );

  c.header("Cache-Control", `public, max-age=${TTL_HIT}`);
  return c.json({ trailer });
});

export default trailers;
