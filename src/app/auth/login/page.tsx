"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Sparkles, AlertCircle, Loader } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        alert("¡Inicio de sesión exitoso!");
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
    <div className="min-h-screen flex items-center justify-center premium-gradient-bg p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl text-left flex flex-col gap-6 relative overflow-hidden">
        {/* Adorno visual */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-amber-500 p-2.5 rounded-xl text-black">
            <Building2 size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            MATERIALES <span className="text-amber-500">INTELIGENTES</span>
          </h2>
          <p className="text-xs text-gray-400">Ingresa a tu cuenta para continuar comprando</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex gap-2 items-center">
            <AlertCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Correo Electrónico</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs text-gray-400 font-medium">Contraseña</label>
              <Link 
                href="/auth/password-reset" 
                className="text-[10px] text-amber-500 hover:underline"
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
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

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-900"></div>
          <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">o</span>
          <div className="flex-grow border-t border-gray-900"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full btn-secondary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.535 0-6.4-2.865-6.4-6.4s2.865-6.4 6.4-6.4c1.582 0 3.03.577 4.148 1.532l3.057-3.057C19.22 2.378 15.935 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.262 0 11.24-4.978 11.24-11.24 0-.648-.076-1.285-.22-1.955H12.24z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <p className="text-center text-xs text-gray-400 mt-2">
          ¿No tienes una cuenta?{" "}
          <Link href="/auth/register" className="text-amber-500 font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
