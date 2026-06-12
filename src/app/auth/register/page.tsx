"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, AlertCircle, Loader, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "loading" | "available" | "taken">("idle");

  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsernames, setIsCheckingUsernames] = useState(false);

  useEffect(() => {
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const fName = normalize(firstName);
    const lName = normalize(lastName);
    
    if (!fName && !lName) {
      setUsernameSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsernames(true);
      
      const bases: string[] = [];
      if (fName && lName) {
        bases.push(`${fName[0]}${lName}`); // jgomez
        bases.push(`${fName}${lName}`); // juangomez
        bases.push(`${fName}.${lName}`); // juan.gomez
        bases.push(`${fName[0]}${lName}${new Date().getFullYear().toString().slice(2)}`); // jgomez26
      } else if (fName) {
        bases.push(fName);
        bases.push(`${fName}${Math.floor(Math.random()*1000)}`);
      } else if (lName) {
        bases.push(lName);
        bases.push(`${lName}${Math.floor(Math.random()*1000)}`);
      }

      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");
      const available: string[] = [];
      
      await Promise.all(bases.map(async (u) => {
        try {
          const res = await fetch(`${API_BASE_URL}/users/auth/check-username/?username=${u}`);
          if (res.ok) {
            const data = await res.json();
            if (data.available) {
              available.push(u);
            }
          }
        } catch(e) {
          console.error("Error validando username:", e);
        }
      }));

      setUsernameSuggestions(available.slice(0, 3));
      setIsCheckingUsernames(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [firstName, lastName]);

  useEffect(() => {
    const checkUser = async () => {
      if (username.length < 3) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("loading");
      try {
        const res = await fetch(`http://localhost:8000/api/users/auth/check-username/?username=${username}`);
        if (res.ok) {
          const data = await res.json();
          setUsernameStatus(data.available ? "available" : "taken");
        } else {
          setUsernameStatus("idle");
        }
      } catch (e) {
        setUsernameStatus("idle");
      }
    };
    const timeout = setTimeout(checkUser, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  useEffect(() => {
    const checkEmail = async () => {
      if (!email.includes('@')) {
        setEmailStatus("idle");
        return;
      }
      setEmailStatus("loading");
      try {
        const res = await fetch(`http://localhost:8000/api/users/auth/check-email/?email=${email}`);
        if (res.ok) {
          const data = await res.json();
          setEmailStatus(data.available ? "available" : "taken");
        } else {
          setEmailStatus("idle");
        }
      } catch (e) {
        setEmailStatus("idle");
      }
    };
    const timeout = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  const isEmailFormatInvalid = email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isPasswordTouched = password.length > 0;
  const isLengthValid = password.length >= 8;
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
  const isSequenceValid = !checkSequenceOrRepeats(password);
  const isPasswordInvalid = isPasswordTouched && (!isLengthValid || !isSequenceValid);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Removemos el reseteo inmediato para evitar que parpadee si el error es el mismo
    // setError("");
    // setSuccess("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/users/auth/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/auth/verify-email-sent?email=${encodeURIComponent(email)}`);
      } else {
        // Formatear errores de Django
        let errorMsg = "";
        for (const key in data) {
          const fieldName = key === 'non_field_errors' ? '' : ''; // Podemos ignorar el fieldName para hacerlo más amigable
          errorMsg += `• ${data[key].join(" ")}\n`;
        }
        setError(errorMsg || "Error al registrar la cuenta.");
      }
    } catch (err) {
      setError("Error de conexión con el servidor. Asegúrate de que el backend esté corriendo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col relative">
      {/* Toast Notifications */}
      {error && (
        <div className="fixed bottom-6 right-6 sm:top-6 sm:bottom-auto z-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-red-100 rounded-xl p-4 max-w-sm w-full flex gap-3 items-start animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 fade-in duration-300">
          <AlertCircle size={20} className="shrink-0 text-red-500 mt-0.5" />
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-bold text-gray-900">Hubo un problema</span>
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{error}</p>
          </div>
          <button type="button" onClick={() => setError("")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {success && (
        <div className="fixed bottom-6 right-6 sm:top-6 sm:bottom-auto z-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-green-100 rounded-xl p-4 max-w-sm w-full flex gap-3 items-start animate-in slide-in-from-bottom-4 sm:slide-in-from-top-4 fade-in duration-300">
          <div className="bg-green-100 rounded-full p-0.5 shrink-0 mt-0.5">
             <span className="text-green-600 font-bold text-xs px-1">✓</span>
          </div>
          <div className="flex flex-col gap-1 pr-4">
            <span className="text-sm font-bold text-gray-900">¡Éxito!</span>
            <p className="text-xs text-gray-600 leading-relaxed">{success}</p>
          </div>
          <button type="button" onClick={() => setSuccess("")} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

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
      <div className="flex-1 flex items-start pt-[8vh] justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] bg-white border border-gray-200 p-8 sm:p-10 rounded-xl flex flex-col gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Creá tu cuenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">Completá tus datos para comenzar</p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600 font-medium">Nombre</label>
                <input
                  type="text"
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-600 font-medium">Apellido</label>
                <input
                  type="text"
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-600 font-medium">Nombre de Usuario</label>
                {usernameStatus === "loading" && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Loader size={10} className="animate-spin" /> Verificando...</span>}
                {usernameStatus === "available" && <span className="text-[10px] text-green-600 font-medium">✓ Disponible</span>}
                {usernameStatus === "taken" && <span className="text-[10px] text-red-600 font-medium">✗ No disponible</span>}
              </div>
              <input
                type="text"
                placeholder="juanperez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`bg-white border rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                  usernameStatus === 'taken' 
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50/30' 
                    : usernameStatus === 'available'
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500 bg-green-50/30'
                    : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                }`}
              />
              {usernameSuggestions.length > 0 && !username && (
                <div className="mt-1 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-gray-500">Sugerencias:</span>
                  {usernameSuggestions.map(sugg => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setUsername(sugg)}
                      className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full transition-colors border border-gray-200"
                    >
                      {sugg}
                    </button>
                  ))}
                  {isCheckingUsernames && <Loader size={10} className="animate-spin text-gray-400" />}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium transition-colors ${isEmailFormatInvalid || emailStatus === 'taken' ? 'text-red-500' : 'text-gray-600'}`}>
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="juan@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`bg-white border rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                  isEmailFormatInvalid || emailStatus === 'taken'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                }`}
              />
              
              {isEmailFormatInvalid && emailStatus !== 'taken' && (
                <div className="flex items-center gap-1.5 text-[#fb3a4d] mt-0.5 animate-in fade-in">
                  <AlertCircle size={14} fill="currentColor" stroke="white" className="shrink-0" />
                  <span className="text-[11px] font-medium">Usá el formato ejemplo@correo.com</span>
                </div>
              )}

              {emailStatus === 'taken' && !isEmailFormatInvalid && (
                <div className="flex flex-col gap-2 mt-0.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-[#fb3a4d]">
                    <AlertCircle size={14} fill="currentColor" stroke="white" className="shrink-0" />
                    <span className="text-[11px] font-medium">Ya existe una cuenta con este e-mail.</span>
                  </div>
                  
                  <div className="bg-[#f5f5f5] rounded-r-lg border-l-4 border-l-[#fb3a4d] p-4 flex flex-col gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-2 items-start">
                      <AlertCircle size={18} fill="#fb3a4d" stroke="white" className="shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-700 leading-relaxed pr-1">
                        Si ya tenés una cuenta de CraftIAr, iniciá sesión en ella. Si preferís crear una cuenta nueva, ingresá otro e-mail.
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => router.push('/auth/login')}
                      className="bg-[#E8612D] hover:bg-[#d45624] text-white text-xs font-semibold py-2.5 px-4 rounded-md transition-all w-fit shadow-sm ml-6"
                    >
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium transition-colors ${isPasswordInvalid ? 'text-red-500' : 'text-gray-600'}`}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`bg-white border rounded-lg pl-4 pr-10 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none transition-all w-full focus:ring-1 ${
                    isPasswordInvalid
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-[#E8612D] focus:ring-[#E8612D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">Confirmar Contraseña</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8612D] hover:bg-[#d45624] text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {loading ? <Loader className="animate-spin" size={16} /> : "Registrarse"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            ¿Ya tenés una cuenta?{" "}
            <Link href="/auth/login" className="text-[#E8612D] font-medium hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
