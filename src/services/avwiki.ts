import { fetchWithUA } from "../lib/fetch";

export const getMovie = async (code: string) => {
  const res = await fetchWithUA(`https://avwikidb.com/work/${encodeURIComponent(code)}/`);
  if (!res.ok) return null;

  let detailText = "";

  await new HTMLRewriter()
    .on("script#__NEXT_DATA__", {
      text: (chunk) => {
        detailText += chunk.text;
      },
    })
    .transform(res)
    .arrayBuffer();

  if (!detailText) return null;

  try {
    return JSON.parse(detailText)?.props?.pageProps.movie || null;
  } catch {
    return null;
  }
};
