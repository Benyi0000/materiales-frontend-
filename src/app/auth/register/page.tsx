"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
        setSuccess("¡Cuenta creada con éxito! El sistema te ha asignado automáticamente el perfil base 'Comprar en la tienda'. Redirigiendo a iniciar sesión...");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        // Formatear errores de Django
        let errorMsg = "";
        for (const key in data) {
          errorMsg += `${key}: ${data[key].join(" ")}\n`;
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
          <div className="flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-semibold text-[#1a1a2e] tracking-tight">
              Creá tu cuenta
            </h2>
            <p className="text-sm text-gray-500 mt-1">Completá tus datos para comenzar</p>
          </div>

          {error && (
            <div className="bg-red-55 border border-red-200/60 text-red-600 rounded-xl p-3 text-xs flex gap-2 items-center">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs flex gap-2 items-center">
              <p>{success}</p>
            </div>
          )}

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
              <label className="text-xs text-gray-600 font-medium">Nombre de Usuario</label>
              <input
                type="text"
                placeholder="juanperez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">Correo Electrónico</label>
              <input
                type="email"
                placeholder="juan@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-600 font-medium">Contraseña (Mínimo 8 caracteres)</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-xs text-gray-800 placeholder-gray-400 outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
