'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function VerifyEmailSentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(10);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Cooldown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 30 seconds countdown for redirect to home
  useEffect(() => {
    if (redirectCountdown <= 0) {
      router.push('/');
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/users/auth/resend-verification/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: data.status || 'Correo reenviado exitosamente.', type: 'success' });
        setCooldown(60); // Iniciar cooldown de 60 segundos
      } else {
        setMessage({ text: data.error || 'No se pudo reenviar el correo.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error de conexión con el servidor.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative overflow-hidden">
      {/* Progress Bar en la parte superior */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-200">
        <div 
          className="h-full bg-[#E8612D] transition-all duration-1000 ease-linear" 
          style={{ width: `${(redirectCountdown / 10) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
        <div className="w-24 h-24 bg-orange-100/80 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <Mail className="w-12 h-12 text-[#E8612D]" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-black text-[#1a1a2e] mb-4 tracking-tight">
          ¡Revisa tu bandeja de entrada!
        </h1>
        
        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-xl leading-relaxed">
          Para garantizar la seguridad de tu cuenta, hemos enviado un enlace de confirmación a tu correo electrónico.
        </p>
        
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-200 mb-10 w-full">
          <p className="text-lg md:text-xl font-bold text-[#1a1a2e] break-all flex items-center justify-center gap-3">
            {email || "tu correo electrónico"}
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          </p>
        </div>

        {message && (
          <div className={`w-full p-4 rounded-xl mb-8 text-sm md:text-base font-medium ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <button
            onClick={handleResend}
            disabled={loading || cooldown > 0 || !email}
            className="flex-1 flex justify-center items-center gap-2 py-4 px-6 rounded-xl shadow-sm text-base font-bold text-white bg-[#1a1a2e] hover:bg-[#2a2a4e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a1a2e] disabled:opacity-50 transition-all"
          >
            {loading ? (
              <RefreshCw className="animate-spin w-5 h-5" />
            ) : cooldown > 0 ? (
              `Esperar ${cooldown}s`
            ) : (
              'Reenviar correo'
            )}
          </button>

          <button
            onClick={() => router.push('/auth/login')}
            className="flex-1 flex justify-center items-center gap-2 py-4 px-6 border-2 border-[#1a1a2e] rounded-xl shadow-sm text-base font-bold text-[#1a1a2e] bg-transparent hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a1a2e] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Login
          </button>
        </div>

        <p className="mt-12 text-sm text-gray-400 font-medium animate-pulse">
          Serás redirigido al inicio en {redirectCountdown} segundos...
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailSent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">Cargando...</div>}>
      <VerifyEmailSentContent />
    </Suspense>
  );
}
