// Sesión única: escucha en tiempo real (SSE) el evento de revocación de sesión.
// Cuando otro dispositivo inicia sesión con la misma cuenta, el backend emite
// un evento 'logout' y aquí cerramos la sesión y redirigimos al login.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

let es: EventSource | null = null;

function handleRevoked() {
  stopSessionWatch();
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/auth/login?session=revoked";
}

/** Abre la conexión SSE de sesión usando el access token actual. */
export function startSessionWatch() {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("access_token");
  if (!token) return;
  stopSessionWatch();

  es = new EventSource(`${API_BASE_URL}/users/session/stream/?token=${encodeURIComponent(token)}`);
  es.addEventListener("logout", handleRevoked);
  // Si la conexión falla, EventSource reintenta solo; no hacemos nada extra.
}

/** Cierra la conexión SSE de sesión (ej. en logout manual o desmontaje). */
export function stopSessionWatch() {
  if (es) {
    es.close();
    es = null;
  }
}
