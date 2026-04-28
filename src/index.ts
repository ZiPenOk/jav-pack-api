import { Hono } from "hono";

import { getMovie } from "./services/avwiki";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => c.text("Hello, World!"));

app.get("/trailers/:code", async (c) => {
  const movie = await getMovie(c.req.param("code"));
  return movie ? c.json({ cid: movie.fanzaContentId, trailer: movie.sampleVideoBestUrl }) : c.notFound();
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
