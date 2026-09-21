// Parses `url` and returns it only if it is a bare http(s) origin (protocol +
// hostname + optional port, no userinfo/path/query/fragment). Returns null
// otherwise. Shared by AppConfig (admin-supplied TENABLE_HOST_URL) and
// TenableController (client-supplied host_url)
export function parseHostUrl(url: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const hasExtra =
    parsed.username !== '' ||
    parsed.password !== '' ||
    (parsed.pathname !== '' && parsed.pathname !== '/') ||
    parsed.search !== '' ||
    parsed.hash !== '';
  if (hasExtra) {
    return null;
  }

  return parsed;
}
