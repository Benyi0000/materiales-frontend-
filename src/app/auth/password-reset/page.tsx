'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Building2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PasswordReset() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/auth/password-reset/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to a confirmation screen
        router.push(`/auth/password-reset/sent?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.error || 'Error al solicitar la recuperación de contraseña.');
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
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
              <Building2 size={22} />
            </div>
            <span className="text-lg font-bold tracking-tight select-none text-[#1a1a2e]">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-start pt-[15vh] justify-center p-4 sm:p-8">
        <div className="w-full max-w-[400px] bg-white border border-gray-200 p-8 sm:p-10 rounded-xl flex flex-col gap-6 shadow-sm relative">
          <Link href="/auth/login" className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors" title="Volver">
            <ArrowLeft size={20} />
          </Link>
          
          <div className="flex flex-col gap-1 text-left pr-8">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Recuperar Contraseña
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-2 w-full bg-[#E8612D] hover:bg-[#d4551f] text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-[0_2px_10px_rgba(232,97,45,0.2)] disabled:opacity-50 flex justify-center items-center h-[44px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enviar Enlace"
              )}
            </button>
          </form>
          
          <div className="text-center mt-2">
            <Link href="/auth/login" className="text-xs font-semibold text-[#1a1a2e] hover:underline">
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
