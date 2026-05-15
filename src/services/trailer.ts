import { fetchWithUA } from "../lib/fetch";

export const getAVWikiDBTrailer = async (code: string, signal?: AbortSignal) => {
  const res = await fetchWithUA(`https://avwikidb.com/work/${encodeURIComponent(code)}/`, { signal });
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

  const trailer = JSON.parse(jsonText).props?.pageProps?.movie?.sampleVideoBestUrl;
  if (!trailer) throw new Error();

  return trailer;
};

export const getDMMTrailer = async (code: string, signal?: AbortSignal) => {
  const apiRes = await fetchWithUA(
    `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
      api_id: "UrwskPfkqQ0DuVry2gYL",
      affiliate_id: "10278-996",
      output: "json",
      site: "FANZA",
      sort: "match",
      keyword: code,
    })}`,
    { signal },
  );
  if (!apiRes.ok) throw new Error();

  const apiJson: any = await apiRes.json();
  if (!apiJson?.result?.items?.length) throw new Error();

  const { content_id: cid, service_code: service, floor_code: floor } = apiJson.result.items[0];
  if (!cid || !service || !floor) throw new Error();

  const dmmRes = await fetchWithUA(
    `https://www.dmm.co.jp/service/digitalapi/-/html5_player/=/cid=${cid}/mtype=AhRVShI_/service=${service}/floor=${floor}/mode=/`,
    { signal, headers: { Cookie: "age_check_done=1" } },
  );
  if (!dmmRes.ok) throw new Error();

  const dmmText = await dmmRes.text();
  if (!dmmText.includes("dmmplayer")) throw new Error();

  const dmmMatch = dmmText.match(/"src"\s*:\s*("[^"\\]*(?:\\.[^"\\]*)*")/)?.[1];
  if (!dmmMatch) throw new Error();

  const trailer = JSON.parse(dmmMatch);
  if (!trailer) throw new Error();

  return trailer.startsWith("//") ? `https:${trailer}` : trailer;
};

export const getJAVDatabaseTrailer = async (code: string, signal?: AbortSignal) => {
  const res = await fetchWithUA(`https://www.javdatabase.com/movies/${encodeURIComponent(code)}/`, { signal });
  if (!res.ok) throw new Error();

  let trailer = "";

  await new HTMLRewriter()
    .on("video#jav-player source", {
      element: (el) => {
        trailer ||= el.getAttribute("src") ?? "";
      },
    })
    .transform(res)
    .arrayBuffer();

  if (!trailer) throw new Error();

  return trailer;
};
