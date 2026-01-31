const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

export const getBaseUrl = () => {
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

const getApiKey = () => {
  const key =
    process.env.SERVER_INTERNAL_API_SECRET ||
    process.env.NEXT_PUBLIC_SERVER_INTERNAL_API_SECRET;
  if (!key) {
    throw new Error(
      "No API secret configured. Set INTERNAL_API_SECRET (preferred) or SERVER_INTERNAL_API_SECRET.",
    );
  }
  return key;
};

/**
 * Server-side fetch wrapper that automatically adds API key to backend requests
 * Use this in Server Components
 */
export async function authenticatedServerFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${getBaseUrl()}${endpoint}`;
  const apiKey = getApiKey();
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${apiKey}`);

  console.log(`[API Client] Fetching: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers,
    cache: options?.cache || "no-store",
  });

  if (response.status === 401) {
    throw new Error(`Unauthorized (401): Invalid API key for endpoint ${endpoint}`);
  }

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Request failed (${response.status}): ${endpoint} - ${responseText}`);
  }

  return response.json();
}

/**
 * Fetch wrapper for client-side use (in Client Components)
 * Automatically adds API key to backend requests
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const apiKey = getApiKey();

  // Add authorization header to requests
  const headers = new Headers(options?.headers || {});
  headers.set("Authorization", `Bearer ${apiKey}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error("Unauthorized: Invalid API key");
  }

  return response;
}

/**
 * Convenience function for GET requests with authentication (Server Components)
 */
export async function getFromBackend<T>(endpoint: string): Promise<T> {
  return authenticatedServerFetch<T>(endpoint, {
    method: "GET",
  });
}

/**
 * Convenience function for POST requests with authentication (Server Components)
 */
export async function postToBackend<T>(
  endpoint: string,
  body?: unknown,
): Promise<T> {
  return authenticatedServerFetch<T>(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
