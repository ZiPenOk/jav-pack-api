import { Hono } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (c) => c.text("Hello, World!"));

app.get("/trailers/:code", async (c) => {
  const code = c.req.param("code");

  const res = await fetch(`https://avwikidb.com/work/${encodeURIComponent(code)}/`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    return c.json({ error: res.statusText }, res.status as ContentfulStatusCode);
  }

  let jsonText = "";

  await new HTMLRewriter()
    .on("script#__NEXT_DATA__", {
      text: (chunk) => {
        jsonText += chunk.text;
      },
    })
    .transform(res)
    .arrayBuffer();

  return jsonText
    ? c.json({
        trailer: JSON.parse(jsonText)?.data?.props?.pageProps?.movie?.sampleVideoBestUrl,
      })
    : c.json({ error: "__NEXT_DATA__ script tag not found" }, 404);
});

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((_, c) => c.json({ error: "Internal Server Error" }, 500));

export default app;
