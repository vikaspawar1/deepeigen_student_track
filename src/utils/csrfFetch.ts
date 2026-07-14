export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  const accessToken = localStorage.getItem("access");
  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      window.location.replace("/login");
    }
    return new Response(
      JSON.stringify({ detail: "Authentication required", code: "AUTH_REQUIRED" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return response;
}

export function buildApiUrl(path: string): string {
  const API_BASE = import.meta.env.VITE_API_URL || "/api";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}
