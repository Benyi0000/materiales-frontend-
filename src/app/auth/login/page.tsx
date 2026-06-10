"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Sparkles, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/auth/login/", {
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
        setError(data.detail || "Credenciales inválidas. Verifica tu correo y contraseña.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor. Asegúrate de que el backend de Django esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/users/auth/google/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "usuario.demo@gmail.com",
          first_name: "Usuario",
          last_name: "Demo Google",
          google_id: "google_123456789",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        alert("¡Autenticación con Google exitosa (Simulada para MVP)!");
        router.push("/");
      } else {
        setError("Error al autenticarse con Google.");
      }
    } catch (err) {
      setError("Error de conexión al autenticar con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] bg-white border border-gray-200 p-8 sm:p-10 rounded-xl flex flex-col gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Ingresá a tu cuenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">Completá tus datos para continuar en CraftIAr</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs flex gap-2 items-center">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">Usuario o Correo Electrónico</label>
              <input
                type="text"
                placeholder="admin o ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
              />
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

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 text-gray-700 transition-all active:scale-[0.99]"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.535 0-6.4-2.865-6.4-6.4s2.865-6.4 6.4-6.4c1.582 0 3.03.577 4.148 1.532l3.057-3.057C19.22 2.378 15.935 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.262 0 11.24-4.978 11.24-11.24 0-.648-.076-1.285-.22-1.955H12.24z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

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
