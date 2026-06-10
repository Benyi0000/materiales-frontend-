"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, AlertCircle, Loader, CheckCircle } from "lucide-react";

function ResetConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const uid = searchParams.get("uid") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !uid) {
      setError("Token o ID de usuario ausentes en la URL. El enlace de recuperación es inválido.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/auth/password-reset-confirm/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          uid,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Contraseña restablecida con éxito. Redirigiendo al login...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(data.error || "Ocurrió un error al restablecer la contraseña. El enlace puede estar vencido.");
      }
    } catch (err) {
      setError("Error de conexión. Asegúrate de que el backend de Django esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
          Restablecé tu contraseña
        </h2>
        <p className="text-sm text-gray-500 mt-1">Introduce tu nueva clave de acceso</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs flex gap-2 items-center">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 text-xs flex flex-col gap-2 items-center text-center">
          <CheckCircle size={24} className="text-green-500 animate-float" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-700">
            <strong>Token cargado desde la URL:</strong> {token.substring(0, 8)}... (UID: {uid})
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-medium">Nueva Contraseña (Mínimo 8 caracteres)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-600 font-medium">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E8612D] text-white hover:bg-[#d4551f] py-3.5 rounded-lg text-xs font-semibold text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.99] shadow-sm"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>Restableciendo...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
            )}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-500 mt-2">
        Volver al{" "}
        <Link href="/auth/login" className="text-[#E8612D] font-semibold hover:text-[#d4551f] hover:underline">
          Inicio de Sesión
        </Link>
      </p>
    </div>
  );
}

export default function PasswordResetConfirmPage() {
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
          <Suspense fallback={
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader size={32} className="animate-spin text-[#E8612D]" />
              <p className="text-xs text-gray-500">Cargando datos de restablecimiento...</p>
            </div>
          }>
            <ResetConfirmForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
