"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, AlertCircle, Loader, CheckCircle } from "lucide-react";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/auth/password-reset/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Se ha procesado tu solicitud. Si el correo está registrado de forma tradicional, recibirás un correo electrónico con las instrucciones en unos momentos.");
        // Imprimir mensaje informativo de desarrollo
        console.log("Nota: Revisa el log de la terminal de Django para ver el email y el token generado.");
      } else {
        setError(data.error || "Ocurrió un error al procesar la solicitud de recuperación.");
      }
    } catch (err) {
      setError("Error de conexión. Asegúrate de que el backend de Django esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center premium-gradient-bg p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl text-left flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-amber-500 p-2.5 rounded-xl text-black">
            <Building2 size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            RECUPERAR <span className="text-amber-500">CONTRASEÑA</span>
          </h2>
          <p className="text-xs text-gray-400">Ingresa tu correo para recibir un enlace de restablecimiento</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex gap-2 items-center">
            <AlertCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-4 text-xs flex flex-col gap-2 items-center text-center">
            <CheckCircle size={24} className="text-green-400 animate-float" />
            <p className="font-medium leading-relaxed">{success}</p>
            <p className="text-[10px] text-amber-500/80 mt-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/15">
              ⚠️ <strong>Entorno de desarrollo:</strong> El correo se ha impreso en la consola de Django. Abre el log para copiar el token e ingresarlo en la confirmación.
            </p>
          </div>
        )}

        {!success && (
          <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Correo Electrónico Registrado</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Enviar Enlace de Recuperación</span>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-2">
          Volver al{" "}
          <Link href="/auth/login" className="text-amber-500 font-semibold hover:underline">
            Inicio de Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
