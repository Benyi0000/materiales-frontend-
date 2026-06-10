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
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Cabecera simple con solo el logo */}
      <header className="w-full bg-white shadow-sm border-b border-gray-100 h-16 shrink-0 flex items-center">
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
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-tr from-orange-50/30 via-white to-orange-100/20 relative">
        <div className="w-full max-w-md bg-white border border-gray-200 p-8 rounded-3xl text-left flex flex-col gap-6 shadow-xl relative overflow-hidden">
          {/* Adorno visual */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#E8612D]/5 rounded-full blur-xl"></div>
          
          <div className="flex flex-col items-center text-center gap-1">
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">
              Recuperar Contraseña
            </h2>
            <p className="text-xs text-gray-500">Ingresá tu correo para recibir un enlace de restablecimiento</p>
          </div>

          {error && (
            <div className="bg-red-55 border border-red-200/60 text-red-600 rounded-xl p-3 text-xs flex gap-2 items-center">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200/60 text-green-700 rounded-xl p-4 text-xs flex flex-col gap-2 items-center text-center">
              <CheckCircle size={24} className="text-green-500 animate-float" />
              <p className="font-medium leading-relaxed">{success}</p>
              <div className="text-[10px] text-amber-700 mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200/60 text-left">
                ⚠️ <strong>Entorno de desarrollo:</strong> El correo se ha impreso en la consola de Django. Abre el log para copiar el token e ingresarlo en la confirmación.
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-505 font-medium">Correo Electrónico Registrado</label>
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-2 focus:ring-[#E8612D]/15 transition-all w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E8612D] text-white hover:bg-[#d4551f] py-3.5 rounded-xl text-xs font-bold text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-sm hover:shadow"
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

          <p className="text-center text-xs text-gray-505 mt-2">
            Volver al{" "}
            <Link href="/auth/login" className="text-[#E8612D] font-semibold hover:text-[#d4551f] hover:underline">
              Inicio de Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
