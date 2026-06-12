"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setErrorMessage("Faltan parámetros de verificación en el enlace.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/users/auth/verify-email/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid, token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(data.error || "El enlace ha expirado o es inválido.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Error de conexión. Intenta nuevamente más tarde.");
      }
    };

    verifyEmail();
  }, [uid, token]);

  return (
    <div className="flex-1 flex items-start pt-[15vh] justify-center p-4 sm:p-8">
      <div className="w-full max-w-[400px] bg-white border border-gray-200 p-8 sm:p-10 rounded-2xl flex flex-col items-center gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        
        {status === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
                Verificando...
              </h2>
              <p className="text-sm text-gray-500">
                Estamos validando tu correo electrónico. Por favor espera unos segundos.
              </p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <CheckCircle2 className="text-green-500" size={32} />
            </div>
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
                ¡Cuenta Activada!
              </h2>
              <p className="text-sm text-gray-500">
                Tu correo electrónico ha sido verificado con éxito. Ya puedes iniciar sesión y comenzar a utilizar CraftIAr.
              </p>
            </div>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full mt-4 bg-[#E8612D] text-white hover:bg-[#d4551f] py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm"
            >
              Ir a Iniciar Sesión
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <XCircle className="text-red-500" size={32} />
            </div>
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">
                Error de verificación
              </h2>
              <p className="text-sm text-gray-600">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => router.push("/auth/register")}
              className="w-full mt-4 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            >
              Volver al Registro
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Cabecera */}
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

      <Suspense fallback={
        <div className="flex-1 flex items-start pt-[15vh] justify-center p-4">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
