'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function PasswordResetConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const uid = searchParams.get('uid') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const isPasswordTouched = newPassword.length > 0;
  const isLengthValid = newPassword.length >= 8;
  
  const checkSequenceOrRepeats = (str: string) => {
    if (/(.)\1{2,}/.test(str)) return true;
    for (let i = 0; i < str.length - 2; i++) {
      const c1 = str.charCodeAt(i);
      const c2 = str.charCodeAt(i + 1);
      const c3 = str.charCodeAt(i + 2);
      if (c2 === c1 + 1 && c3 === c2 + 1) return true;
      if (c2 === c1 - 1 && c3 === c2 - 1) return true;
    }
    return false;
  };
  const isSequenceValid = !checkSequenceOrRepeats(newPassword);
  const isPasswordInvalid = isPasswordTouched && (!isLengthValid || !isSequenceValid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token || !uid) {
      setError('El enlace de recuperación es inválido o está incompleto.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (isPasswordInvalid) {
      setError('La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/auth/password-reset-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          uid,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('¡Tu contraseña ha sido restablecida exitosamente! Redirigiendo al login...');
        setTimeout(() => router.push('/auth/login'), 3000);
      } else {
        setError(data.error || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative">
      {error && (
        <div className="fixed bottom-6 right-6 sm:top-6 sm:bottom-auto z-50 bg-white shadow-lg border border-red-100 rounded-xl p-4 max-w-sm w-full flex gap-3 items-start animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 fade-in duration-300">
          <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-bold text-gray-900">Error</span>
            <p className="text-xs text-gray-600">{error}</p>
          </div>
          <button type="button" onClick={() => setError("")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      <header className="w-full bg-white border-b border-gray-200 h-16 shrink-0 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 shrink-0 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CraftIAr" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight select-none text-[#1a1a2e]">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-start pt-[10vh] justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] bg-white border border-gray-200 p-5 sm:p-8 rounded-xl flex flex-col gap-6 shadow-sm">
          {success ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
                ¡Contraseña Restablecida!
              </h2>
              <p className="text-sm text-gray-500 max-w-[260px]">
                {success}
              </p>
              <div className="w-6 h-6 border-2 border-[#E8612D]/30 border-t-[#E8612D] rounded-full animate-spin mt-4" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 text-left">
                <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
                  Crear Nueva Contraseña
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Por favor ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-medium transition-colors ${isPasswordInvalid ? 'text-red-500' : 'text-gray-600'}`}>
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Crea una contraseña segura"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className={`bg-white border rounded-lg pl-4 pr-10 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                        isPasswordInvalid 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-start gap-1.5">
                      {isPasswordTouched ? (
                        isLengthValid ? (
                          <CheckCircle2 size={14} fill="#10b981" stroke="white" className="shrink-0 text-[#10b981] mt-0.5" />
                        ) : (
                          <AlertCircle size={14} fill="currentColor" stroke="white" className="shrink-0 text-[#fb3a4d] mt-0.5" />
                        )
                      ) : (
                        <Circle size={14} className="shrink-0 text-gray-400 mt-0.5" />
                      )}
                      <span className="text-[11px] text-gray-700">
                        Usá mínimo 8 caracteres.
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      {isPasswordTouched ? (
                        isSequenceValid ? (
                          <CheckCircle2 size={14} fill="#10b981" stroke="white" className="shrink-0 text-[#10b981] mt-0.5" />
                        ) : (
                          <AlertCircle size={14} fill="currentColor" stroke="white" className="shrink-0 text-[#fb3a4d] mt-0.5" />
                        )
                      ) : (
                        <Circle size={14} className="shrink-0 text-gray-400 mt-0.5" />
                      )}
                      <span className="text-[11px] text-gray-700 leading-tight">
                        No uses secuencias como 123 ni caracteres repetidos como aaa.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-600 font-medium">Confirmar Contraseña</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`bg-white border rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                      confirmPassword && newPassword !== confirmPassword
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || isPasswordInvalid || confirmPassword !== newPassword}
                  className="mt-4 w-full bg-[#E8612D] hover:bg-[#d4551f] text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-[0_2px_10px_rgba(232,97,45,0.2)] disabled:opacity-50 flex justify-center items-center h-[44px]"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Guardar y Continuar"
                  )}
                </button>
              </form>
              
              <div className="text-center">
                <Link href="/auth/login" className="text-xs font-semibold text-[#1a1a2e] hover:underline">
                  Volver al Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PasswordResetConfirm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PasswordResetConfirmContent />
    </Suspense>
  );
}
