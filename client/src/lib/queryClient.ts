import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { translateError } from "./error-translator";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "en";
    const friendly = translateError(`${res.status}: ${text}`, lang);
    throw new Error(friendly);
  }
}

export async function apiRequest(
  methodOrUrl: string,
  urlOrOptions?: string | { method?: string; body?: unknown },
  data?: unknown | undefined,
): Promise<Response> {
  let method: string;
  let url: string;
  let body: unknown | undefined;

  if (urlOrOptions === undefined) {
    // apiRequest("/api/foo") - GET by default
    method = "GET";
    url = methodOrUrl;
    body = undefined;
  } else if (typeof urlOrOptions === "string") {
    // apiRequest("POST", "/api/foo", data?)
    method = methodOrUrl;
    url = urlOrOptions;
    body = data;
  } else {
    // apiRequest("/api/foo", { method: "POST", body: data })
    method = urlOrOptions.method || "GET";
    url = methodOrUrl;
    body = urlOrOptions.body;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/** Safe fetch that throws on non-OK responses. Use in custom queryFn instead of raw .then(r => r.json()) */
export async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
