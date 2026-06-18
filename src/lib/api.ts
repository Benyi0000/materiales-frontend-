const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let token = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token");
  }

  // Preparamos los headers inyectando el Authorization si existe el token
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // Si recibimos 401 Unauthorized y tenemos un token (posible expiración)
  if (response.status === 401 && typeof window !== "undefined" && token) {
    const refreshToken = localStorage.getItem("refresh_token");
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/users/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          // Guardamos los nuevos tokens
          localStorage.setItem("access_token", data.access);
          if (data.refresh) {
            localStorage.setItem("refresh_token", data.refresh);
          }

          // Reintentamos la petición original con el nuevo access token
          headers.set("Authorization", `Bearer ${data.access}`);
          response = await fetch(url, { ...options, headers });

          // Si sigue 401 tras refrescar, la sesión fue revocada (login en otro
          // dispositivo): limpiamos y mandamos al login. Fallback del SSE.
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/auth/login?session=revoked";
          }
        } else {
          // El refresh token expiró o es inválido. Forzar re-login
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/auth/login";
        }
      } catch (err) {
        // Error de red intentando refrescar
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth/login";
      }
    } else {
      // No había refresh token
      localStorage.removeItem("access_token");
      window.location.href = "/auth/login";
    }
  }

  return response;
}
