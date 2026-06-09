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
      <div className="flex flex-col items-center text-center gap-2">
        <div className="bg-amber-500 p-2.5 rounded-xl text-black">
          <Building2 size={28} />
        </div>
        <h2 className="text-xl font-bold tracking-tight mt-2">
          NUEVA <span className="text-amber-500">CONTRASEÑA</span>
        </h2>
        <p className="text-xs text-gray-400">Introduce tu nueva clave de acceso</p>
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
          <p className="font-medium">{success}</p>
        </div>
      )}

      {!success && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-500/80">
            <strong>Token cargado desde la URL:</strong> {token.substring(0, 8)}... (UID: {uid})
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Nueva Contraseña (Mínimo 8 caracteres)</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <span>Restableciendo...</span>
              </>
            ) : (
              <span>Restablecer Contraseña</span>
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
  );
}

export default function PasswordResetConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center premium-gradient-bg p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
        <Suspense fallback={
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader size={32} className="animate-spin text-amber-500" />
            <p className="text-xs text-gray-400">Cargando datos de restablecimiento...</p>
          </div>
        }>
          <ResetConfirmForm />
        </Suspense>
      </div>
    </div>
  );
}
