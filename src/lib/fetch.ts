export const fetchWithUA = (input: RequestInfo | URL, init?: RequestInit<RequestInitCfProperties>) => {
  const headers = new Headers(init?.headers);
  headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36");
  return fetch(input, { ...init, headers });
};
