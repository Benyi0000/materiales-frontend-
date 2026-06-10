import React, { useState } from "react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Por favor, complete los campos obligatorios: Usuario, Email y Contraseña.");
      return;
    }

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
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-[#6b7280] font-medium">Nombre de Usuario (Obligatorio)</label>
          <input
            type="text"
            placeholder="Ej: jgomez"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[#6b7280] font-medium">Correo Electrónico (Obligatorio)</label>
          <input
            type="email"
            placeholder="ejemplo@tienda.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[#6b7280] font-medium">Nombre (Opcional)</label>
          <input
            type="text"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[#6b7280] font-medium">Apellido (Opcional)</label>
          <input
            type="text"
            placeholder="Gómez"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 text-xs">
        <label className="text-[#6b7280] font-medium">Contraseña (Obligatorio)</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-xs text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D] transition-all"
        />
      </div>
      
      {/* Checkboxes de Perfiles a Asignar en Creación con Expiración por Perfil (RF 6.5) */}
      <div className="flex flex-col gap-2 text-xs border-t border-[#e5e7eb] pt-4 mt-2">
        <label className="text-[#6b7280] font-bold uppercase tracking-wider text-[10px]">Perfiles Iniciales y Expiración</label>
        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2 mt-1">
          {profiles.map(p => {
            const selectedProfile = selectedProfiles.find(sp => sp.id === p.id);
            const isSelected = !!selectedProfile;
            
            return (
              <div key={p.id} className="bg-gray-50 border border-[#e5e7eb] rounded-lg p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProfiles([...selectedProfiles, { id: p.id, expires_at: "" }]);
                        } else {
                          setSelectedProfiles(selectedProfiles.filter(sp => sp.id !== p.id));
                        }
                      }}
                      className="custom-checkbox shrink-0"
                    />
                    <div className="text-left">
                      <span className="text-xs text-[#1a1a2e] font-bold">{p.name}</span>
                      <p className="text-[10px] text-[#6b7280] mt-0.5">{p.description}</p>
                    </div>
                  </label>
                </div>
                
                {isSelected && (
                  <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-2 text-[10px]">
                    <span className="text-[#6b7280]">Fecha de Expiración (Opcional):</span>
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
                      className="bg-white border border-gray-300 text-[10px] rounded-lg px-2 py-1 text-[#1a1a2e] outline-none w-36"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 border-t border-[#e5e7eb] pt-6 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a2e] hover:bg-gray-50 text-xs font-bold py-3 rounded-xl transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-[#E8612D] hover:bg-[#d4551f] text-white text-xs font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear Usuario"}
        </button>
      </div>
    </form>
  );
}
