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
    <div className="min-h-screen flex items-center justify-center premium-gradient-bg p-6">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl text-left flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="bg-amber-500 p-2.5 rounded-xl text-black">
            <Building2 size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-tight mt-2">
            CREAR <span className="text-amber-500">CUENTA</span>
          </h2>
          <p className="text-xs text-gray-400">Regístrate para comprar materiales de construcción</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs flex gap-2 items-center">
            <AlertCircle size={16} className="shrink-0" />
            <p className="whitespace-pre-line">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 text-xs flex gap-2 items-center">
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Nombre</label>
              <input
                type="text"
                placeholder="Juan"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 font-medium">Apellido</label>
              <input
                type="text"
                placeholder="Pérez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Nombre de Usuario</label>
            <input
              type="text"
              placeholder="juanperez"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Correo Electrónico</label>
            <input
              type="email"
              placeholder="juan@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Contraseña (Mínimo 8 caracteres)</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 pr-10 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 w-full transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 font-medium">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 pr-10 text-xs text-white placeholder-gray-600 outline-none focus:border-amber-500/40 w-full transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 rounded-xl text-xs font-bold text-center mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <span>Registrarse</span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-2">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-amber-500 font-semibold hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
