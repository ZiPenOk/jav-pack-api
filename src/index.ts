import { Hono } from "hono";

import AVWikiDB from "./services/AVWikiDB";
import JAVDatabase from "./services/JAVDatabase";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => c.text("Hello, World!"));

app.get("/trailers/:code", async (c) => {
  const code = c.req.param("code");

  try {
    return c.json(await Promise.any([AVWikiDB.getTrailer(code), JAVDatabase.getTrailer(code)]));
  } catch {
    return c.notFound();
  }
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
