import "server-only";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const getBackendBaseUrl = () => {
  if (process.env.SERVER_URL) {
    return normalizeBaseUrl(process.env.SERVER_URL);
  }
  if (process.env.NEXT_PUBLIC_SERVER_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_SERVER_URL);
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "development") return "http://localhost:8000";
  return "https://api.dashboard.example.com";
};

const getServerApiKey = () => {
  const key =
    process.env.SERVER_INTERNAL_API_SECRET ||
    process.env.INTERNAL_API_SECRET ||
    process.env.INTERNAL_API_KEY;
  if (!key) {
    throw new Error(
      "No API secret configured. Set INTERNAL_API_SECRET (preferred), SERVER_INTERNAL_API_SECRET, or INTERNAL_API_KEY.",
    );
  }
  return key;
};

export async function proxyToBackend(
  request: Request,
  backendPath: string,
): Promise<Response> {
  try {
    const incomingUrl = new URL(request.url);
    const query = incomingUrl.search || "";
    const targetUrl = `${getBackendBaseUrl()}${backendPath}${query}`;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");
    headers.set("Authorization", `Bearer ${getServerApiKey()}`);

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const response = await fetch(targetUrl, init);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to proxy request to backend";
    return Response.json({ detail: message }, { status: 502 });
  }
}
