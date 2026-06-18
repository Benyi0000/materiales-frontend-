'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';

function PasswordResetSentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative">
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
        <div className="w-full max-w-[400px] bg-white border border-gray-200 p-5 sm:p-8 rounded-xl flex flex-col gap-6 shadow-sm text-center">
          <div className="w-16 h-16 bg-[#E8612D]/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Mail size={32} className="text-[#E8612D]" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Revisa tu Correo
            </h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Enviamos un enlace de recuperación a: <br/>
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
          </div>

          <div className="bg-[#f5f5f5] p-4 rounded-lg text-xs text-gray-600 mt-2 text-left">
            <p className="font-medium text-gray-800 mb-1">¿No recibiste el correo?</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Revisa tu carpeta de Spam o Correo no deseado.</li>
              <li>Asegúrate de haber ingresado el correo correctamente.</li>
              <li>El correo puede demorar un par de minutos en llegar.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Link 
              href="/auth/login"
              className="w-full bg-[#E8612D] hover:bg-[#d4551f] text-white font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-[0_2px_10px_rgba(232,97,45,0.2)] flex justify-center items-center h-[44px]"
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PasswordResetSent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <PasswordResetSentContent />
    </Suspense>
  );
}
