import { fetchWithUA } from "../lib/fetch";

const getTrailer = async (code: string) => {
  const res = await fetchWithUA(`https://avwikidb.com/work/${encodeURIComponent(code)}/`);
  if (!res.ok) throw new Error();

  let jsonText = "";

  await new HTMLRewriter()
    .on("script#__NEXT_DATA__", {
      text: ({ text }) => {
        jsonText += text;
      },
    })
    .transform(res)
    .arrayBuffer();

  if (!jsonText) throw new Error();

  const trailer = JSON.parse(jsonText)?.props?.pageProps?.movie?.sampleVideoBestUrl;
  if (!trailer) throw new Error();

  return { trailer };
};

export default { getTrailer };
