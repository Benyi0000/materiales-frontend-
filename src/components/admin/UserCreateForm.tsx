import React, { useState, useEffect } from "react";
import { Eye, EyeOff, KeyRound, Mail, User, ShieldCheck, Calendar, Zap, AlertCircle } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  description: string;
}

interface UserCreateFormProps {
  profiles: Profile[];
  onSubmit: (data: any) => Promise<boolean>;
  onCancel: () => void;
}

export default function UserCreateForm({ profiles, onSubmit, onCancel }: UserCreateFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProfiles, setSelectedProfiles] = useState<{ id: number; expires_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{username?: string, email?: string, password?: string}>({});
  
  // Sugerencias asíncronas
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isCheckingUsernames, setIsCheckingUsernames] = useState(false);

  // Generador de sugerencias (Spec)
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

      // Nos quedamos con las primeras 3 disponibles
      setUsernameSuggestions(available.slice(0, 3));
      setIsCheckingUsernames(false);
    }, 600); // Debounce de 600ms

    return () => clearTimeout(timer);
  }, [firstName, lastName]);

  const validateForm = () => {
    const newErrors: any = {};
    if (!username.trim()) newErrors.username = "El nombre de usuario es obligatorio";
    else if (username.length < 4 || username.length > 30) newErrors.username = "Debe tener entre 4 y 30 caracteres";
    else if (!/^[a-zA-Z0-9._-]+$/.test(username)) newErrors.username = "Solo letras, números, puntos y guiones";
    
    if (!email.trim()) newErrors.email = "El correo electrónico es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "El formato de correo es inválido";
    if (!password.trim()) newErrors.password = "La contraseña es obligatoria";
    else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres requeridos";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let p = "";
    for(let i=0; i<12; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(p);
    setShowPassword(true);
    setErrors(prev => ({ ...prev, password: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const success = await onSubmit({
      username,
      email,
      first_name: firstName,
      last_name: lastName,
      password,
      profiles: selectedProfiles.map(sp => ({
        id: sp.id,
        expires_at: sp.expires_at ? new Date(sp.expires_at).toISOString() : null
      }))
    });
    setLoading(false);

    if (success) {
      // Limpiar formulario
      setUsername("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setSelectedProfiles([]);
      setErrors({});
      setUsernameSuggestions([]);
    }
  };

  const handleProfileClick = (profileId: number) => {
    const exists = selectedProfiles.find(sp => sp.id === profileId);
    if (exists) {
      setSelectedProfiles(selectedProfiles.filter(sp => sp.id !== profileId));
    } else {
      setSelectedProfiles([...selectedProfiles, { id: profileId, expires_at: "" }]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left w-full">
      
      {/* SECCIÓN DE DATOS PERSONALES */}
      <div>
        <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 uppercase tracking-wider flex items-center gap-2">
          <User size={16} className="text-[#E8612D]" />
          Datos del Usuario
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* First Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#6b7280] font-medium">Nombre</label>
            <input
              type="text"
              placeholder="Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border border-gray-200 focus:border-[#E8612D] focus:ring-4 focus:ring-[#E8612D]/10 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#6b7280] font-medium">Apellido</label>
            <input
              type="text"
              placeholder="Gómez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border border-gray-200 focus:border-[#E8612D] focus:ring-4 focus:ring-[#E8612D]/10 bg-gray-50 focus:bg-white"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#6b7280] font-medium">Nombre de Usuario <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={16} className={errors.username ? "text-red-400" : "text-gray-400"} />
              </div>
              <input
                type="text"
                placeholder="Ej: jgomez"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors(prev => ({...prev, username: ""})) }}
                className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none transition-all border ${errors.username ? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:border-[#E8612D] focus:ring-4 focus:ring-[#E8612D]/10 bg-gray-50 focus:bg-white'}`}
              />
            </div>
            {errors.username && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12}/>{errors.username}</p>}
            
            {/* SUGERENCIAS DE USUARIO */}
            {isCheckingUsernames ? (
              <div className="text-[10px] text-gray-400 font-medium ml-1 animate-pulse flex items-center gap-1 mt-1">
                <div className="w-2 h-2 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
                Verificando nombres...
              </div>
            ) : usernameSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1 items-center">
                <span className="text-[10px] text-gray-500 font-medium">Sugerencias libres:</span>
                {usernameSuggestions.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => { setUsername(sug); setErrors(prev => ({...prev, username: ""})); }}
                    className="bg-[#fff7ed] hover:bg-[#E8612D] text-[#E8612D] hover:text-white text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors border border-[#E8612D]/30 shadow-sm"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#6b7280] font-medium">Correo Electrónico <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className={errors.email ? "text-red-400" : "text-gray-400"} />
              </div>
              <input
                type="email"
                placeholder="ejemplo@empresa.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({...prev, email: ""})) }}
                className={`w-full pl-10 pr-3 py-3 rounded-xl text-sm outline-none transition-all border ${errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:border-[#E8612D] focus:ring-4 focus:ring-[#E8612D]/10 bg-gray-50 focus:bg-white'}`}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12}/>{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE SEGURIDAD */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 uppercase tracking-wider flex items-center gap-2">
          <KeyRound size={16} className="text-[#E8612D]" />
          Seguridad
        </h3>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-end">
            <label className="text-sm text-[#6b7280] font-medium">Contraseña de Acceso <span className="text-red-500">*</span></label>
            <button 
              type="button" 
              onClick={generatePassword}
              className="text-xs text-[#E8612D] font-bold flex items-center gap-1 hover:text-[#d4551f] transition-colors"
            >
              <Zap size={14} />
              Generar segura
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyRound size={16} className={errors.password ? "text-red-400" : "text-gray-400"} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Escribe o genera una contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({...prev, password: ""})) }}
              className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm outline-none transition-all border ${errors.password ? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/30' : 'border-gray-200 focus:border-[#E8612D] focus:ring-4 focus:ring-[#E8612D]/10 bg-gray-50 focus:bg-white'}`}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle size={12}/>{errors.password}</p>}
        </div>
      </div>
      
      {/* SECCIÓN DE PERFILES */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#E8612D]" />
          Perfiles Iniciales
        </h3>
        
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {profiles.map(p => {
            const selectedProfile = selectedProfiles.find(sp => sp.id === p.id);
            const isSelected = !!selectedProfile;
            
            return (
              <div 
                key={p.id} 
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${isSelected ? 'border-[#E8612D] bg-[#fff7ed] shadow-sm' : 'border-gray-200 bg-white hover:border-[#E8612D]/40 hover:shadow-sm cursor-pointer'}`}
              >
                <div 
                  className="p-4 flex items-center gap-4 cursor-pointer"
                  onClick={() => handleProfileClick(p.id)}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-[#E8612D] border-[#E8612D]' : 'border-gray-300 bg-white'}`}>
                    {isSelected && <ShieldCheck size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${isSelected ? 'text-[#E8612D]' : 'text-[#1a1a2e]'}`}>{p.name}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="px-4 pb-4 pt-1 flex items-center gap-3 animate-[fadeIn_0.2s_ease]">
                    <Calendar size={14} className="text-[#E8612D]" />
                    <span className="text-xs font-medium text-gray-600">Expiración (Opcional):</span>
                    <input
                      type="date"
                      value={selectedProfile.expires_at}
                      onChange={(e) => {
                        setSelectedProfiles(
                          selectedProfiles.map(sp => 
                            sp.id === p.id ? { ...sp, expires_at: e.target.value } : sp
                          )
                        );
                      }}
                      className="bg-white border border-[#E8612D]/30 text-xs rounded-lg px-3 py-2 text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-2 focus:ring-[#E8612D]/20 transition-all"
                    />
                  </div>
                )}
              </div>
            );
          })}
          {profiles.length === 0 && (
            <p className="text-sm text-gray-500 italic py-4">No hay perfiles disponibles para asignar.</p>
          )}
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-4 border-t border-gray-100 pt-6 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-gray-200 text-gray-600 hover:text-[#1a1a2e] hover:bg-gray-50 hover:border-gray-300 text-sm font-bold py-3.5 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[2] bg-[#E8612D] hover:bg-[#d4551f] text-white text-sm font-bold py-3.5 rounded-xl transition-all shadow-md shadow-[#E8612D]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="animate-pulse">Procesando...</span>
          ) : (
            <>
              <User size={18} />
              <span>Crear Usuario en el Sistema</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
