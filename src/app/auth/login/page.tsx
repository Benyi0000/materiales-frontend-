"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Sparkles, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "879676093619-vacm88jq32dpihgqrj06muu0p6p5e6oi.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Aviso cuando la sesión fue cerrada por un login en otro dispositivo (sesión única)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("session") === "revoked") {
        setError("Tu sesión se cerró porque iniciaste sesión en otro dispositivo.");
      }
    }
  }, []);

  // Solo validamos formato de correo si detectamos que está intentando escribir uno (tiene un '@')
  const isEmailInvalid = email.length > 0 && email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(""); // Evitamos el parpadeo
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email, // Django expects username, which is mapped to email in settings
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Guardar tokens JWT en localStorage
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        
        // Guardar datos básicos
        router.push("/"); // Redirigir al inicio/catálogo
      } else {
        const errorCode = Array.isArray(data.error) ? data.error[0] : data.error;
        const errorEmail = Array.isArray(data.email) ? data.email[0] : data.email;
        const errorUsername = Array.isArray(data.username) ? data.username[0] : data.username;
        const errorDetail = Array.isArray(data.detail) ? data.detail[0] : data.detail;

        if (errorCode === "unverified" && errorEmail) {
          router.push(`/auth/verify-email-sent?email=${encodeURIComponent(errorEmail)}`);
        } else if (errorCode === "force_password_change" && errorUsername) {
          router.push(`/auth/change-initial-password?username=${encodeURIComponent(errorUsername)}&tmp=${encodeURIComponent(password)}`);
        } else if (res.status === 401 || res.status === 403 || res.status === 429) {
          setError("Credenciales incorrectas o acceso bloqueado por intentos fallidos. Revisá tu correo o esperá unos minutos.");
        } else {
          setError(errorDetail || "Error al iniciar sesión.");
        }
      }
    } catch (err) {
      setError("Error de conexión con el servidor. Asegúrate de que el backend de Django esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  // Recibe el ID token verificado de Google y lo intercambia por JWT del sistema
  const handleGoogleCredential = async (response: any) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/auth/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        router.push("/");
      } else {
        setError(data.error || "No se pudo iniciar sesión con Google.");
      }
    } catch (err) {
      setError("Error de conexión al autenticar con Google.");
    } finally {
      setLoading(false);
    }
  };

  // Carga Google Identity Services y renderiza el botón oficial
  useEffect(() => {
    const SCRIPT_ID = "google-gsi-script";
    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleBtnRef.current) return;
      g.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential });
      googleBtnRef.current.innerHTML = "";
      g.accounts.id.renderButton(googleBtnRef.current, { theme: "outline", size: "large", text: "continue_with", width: 340, locale: "es" });
    };
    if (document.getElementById(SCRIPT_ID)) { init(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true; s.id = SCRIPT_ID;
    s.onload = init;
    document.body.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative">
      {/* Toast Notifications */}
      {error && (
        <div className="fixed bottom-6 right-6 sm:top-6 sm:bottom-auto z-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-red-100 rounded-xl p-4 max-w-sm w-full flex gap-3 items-start animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 fade-in duration-300">
          <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-bold text-gray-900">Acceso denegado</span>
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{error}</p>
          </div>
          <button type="button" onClick={() => setError("")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Cabecera simple con solo el logo */}
      <header className="w-full bg-white border-b border-gray-200 h-16 shrink-0 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 shrink-0 w-fit">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
              <Building2 size={22} />
            </div>
            <span className="text-lg font-bold tracking-tight select-none text-[#1a1a2e]">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Contenedor del formulario */}
      <div className="flex-1 flex items-start pt-[10vh] justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] bg-white border border-gray-200 p-8 sm:p-10 rounded-xl flex flex-col gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Ingresá a tu cuenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">Completá tus datos para continuar en CraftIAr</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium transition-colors ${isEmailInvalid ? 'text-red-500' : 'text-gray-600'}`}>
                Usuario o Correo Electrónico
              </label>
              <input
                type="text"
                placeholder="admin o ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`bg-white border rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                  isEmailInvalid
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                }`}
              />
              {isEmailInvalid && (
                <div className="flex items-center gap-1.5 text-[#fb3a4d] mt-0.5 animate-in fade-in">
                  <AlertCircle size={14} fill="currentColor" stroke="white" className="shrink-0" />
                  <span className="text-[11px] font-medium">Usá el formato ejemplo@correo.com</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-600 font-medium">Contraseña</label>
                <Link 
                  href="/auth/password-reset" 
                  className="text-[10px] text-[#E8612D] hover:text-[#d4551f] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8612D] text-white hover:bg-[#d4551f] py-3.5 rounded-lg text-xs font-semibold text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.99] shadow-sm"
            >
              {loading ? (
                <>
                  <Loader size={14} className="animate-spin" />
                  <span>Ingresando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider">o</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div ref={googleBtnRef} className="flex justify-center min-h-[44px]" />

          <p className="text-center text-xs text-gray-500 mt-2">
            ¿No tenés una cuenta?{" "}
            <Link href="/auth/register" className="text-[#E8612D] font-semibold hover:text-[#d4551f] hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
