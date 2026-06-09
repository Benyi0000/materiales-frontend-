import React, { useState } from "react";
import { ShieldCheck, Users, Plus, Shield } from "lucide-react";
import UserCreateForm from "./UserCreateForm";

interface Profile {
  id: number;
  name: string;
  description: string;
  permissions_detail?: any[];
}

interface PermissionAtom {
  id: number;
  code: string;
  module: string;
  description: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  assignments?: any[];
}

interface ProfileSecurityProps {
  users: User[];
  profiles: Profile[];
  permissions: PermissionAtom[];
  selectedAdminUser: User | null;
  setSelectedAdminUser: (u: User) => void;
  profileExpirations: { [key: number]: string };
  setProfileExpirations: (exp: { [key: number]: string }) => void;
  editingProfile: Profile | null;
  setEditingProfile: (p: Profile) => void;
  toggleUserProfile: (user: User, profileId: number) => void;
  handleTogglePermissionInProfile: (permissionId: number) => void;
  handleUpdatePermissionScope: (permissionId: number, newScope: "propios" | "todos") => void;
  handleCreateProfile: (name: string, description: string) => void;
  handleDeleteProfile: (profileId: number) => void;
  handleSaveProfilePermissions: () => void;
  handleCreateUserSubmit: (data: any) => Promise<boolean>;
  showCreateUserForm: boolean;
  setShowCreateUserForm: (show: boolean) => void;
}

export default function ProfileSecurity({
  users,
  profiles,
  permissions,
  selectedAdminUser,
  setSelectedAdminUser,
  profileExpirations,
  setProfileExpirations,
  editingProfile,
  setEditingProfile,
  toggleUserProfile,
  handleTogglePermissionInProfile,
  handleUpdatePermissionScope,
  handleCreateProfile,
  handleDeleteProfile,
  handleSaveProfilePermissions,
  handleCreateUserSubmit,
  showCreateUserForm,
  setShowCreateUserForm,
}: ProfileSecurityProps) {
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="flex-grow flex flex-col gap-6 text-left">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-amber-500" />
          <span>Configuración de Seguridad y Perfiles</span>
        </h2>
        <p className="text-xs text-gray-400">Asignación de perfiles compuestos dinámicos y configuración de permisos con alcances.</p>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        
        {/* 1. SECCIÓN: ASIGNAR PERFILES A USUARIOS */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-amber-500" />
              <span>Asignar Perfiles a Usuarios</span>
            </h3>
            <button
              onClick={() => {
                setShowCreateUserForm(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={12} />
              <span>+ Nuevo usuario</span>
            </button>
          </div>

          {/* Modal de Alta de Usuario (RF 6.5) */}
          {showCreateUserForm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <div className="bg-gray-950 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative text-left">
                <button
                  onClick={() => setShowCreateUserForm(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
                
                <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-4">
                  <Users size={20} />
                  <span>Alta de Usuario (Modal)</span>
                </h3>
                
                <UserCreateForm 
                  profiles={profiles}
                  onSubmit={handleCreateUserSubmit}
                  onCancel={() => setShowCreateUserForm(false)}
                />
              </div>
            </div>
          )}

          {/* Selector de Usuario a Configurar */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedAdminUser(u)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all ${
                  selectedAdminUser?.id === u.id
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-500 font-bold"
                    : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {u.first_name} {u.last_name}
              </button>
            ))}
          </div>

          {/* Checklist de perfiles para el usuario seleccionado */}
          <div className="flex flex-col gap-3 mt-2 border-t border-gray-900 pt-4">
            {selectedAdminUser ? (
              <>
                <p className="text-xs text-gray-400">Marcar o desmarcar para asignar/revocar perfiles en tiempo real:</p>
                
                {profiles.map(profile => {
                  const assignment = (selectedAdminUser.assignments || []).find((asg: any) => asg.profile === profile.id);
                  const isAssigned = !!assignment;
                  
                  return (
                    <div key={profile.id} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-gray-900">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleUserProfile(selectedAdminUser, profile.id)}
                          className="custom-checkbox shrink-0"
                        />
                        <div className="text-left">
                          <h4 className="text-xs font-bold text-white">{profile.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{profile.description}</p>
                          {/* Resumen de Módulos Activos (RF 1.3) */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.from(new Set((profile.permissions_detail || []).map((pd: any) => {
                              const m = pd.module;
                              if (m === "catalog") return "Catálogo";
                              if (m === "orders") return "Pedidos";
                              if (m === "cart") return "Carrito";
                              if (m === "tutor") return "Tutor IA";
                              if (m === "gestion") return "Gestión";
                              if (m === "admin") return "Admin";
                              return m;
                            }))).map((m: any, idx: number) => (
                              <span key={idx} className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-semibold px-1.5 py-0.5 rounded font-mono">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Campo de Expiración (RF 1.6) */}
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-[9px] text-gray-500 font-semibold uppercase">Expiración</span>
                        <input
                          type="date"
                          value={profileExpirations[profile.id] || ""}
                          onChange={(e) => {
                            setProfileExpirations({
                              ...profileExpirations,
                              [profile.id]: e.target.value
                            });
                          }}
                          className="bg-gray-900 border border-gray-800 text-[10px] rounded px-1.5 py-0.5 text-gray-300 outline-none w-28"
                        />
                        {isAssigned && assignment?.expires_at && (
                          <span className="text-[9px] text-amber-400/80">
                            Vence: {new Date(assignment.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-xs text-gray-500">Cargando usuarios...</p>
            )}
          </div>
        </div>

        {/* 2. SECCIÓN: CONFIGURACIÓN DINÁMICA DE PERFILES Y PERMISOS */}
        <div className="bg-gray-950/40 border border-gray-900 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-amber-500" />
              <span>Configurar Permisos del Perfil</span>
            </h3>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
            >
              <Plus size={12} />
              <span>{showCreateForm ? "Cancelar" : "Nuevo Perfil"}</span>
            </button>
          </div>

          {showCreateForm ? (
            <div className="bg-black/20 border border-gray-900 rounded-2xl p-4 flex flex-col gap-3">
              <h4 className="text-xs font-bold text-amber-500">Crear Nuevo Perfil Compuesto</h4>
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-gray-400">Nombre del Perfil</label>
                <input
                  type="text"
                  placeholder="Ej: Gestor de Corralón"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/40"
                />
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <label className="text-gray-400">Descripción</label>
                <textarea
                  placeholder="Ej: Permite gestionar stock y pedidos de obra..."
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/40 h-16 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  handleCreateProfile(newProfileName, newProfileDesc);
                  setNewProfileName("");
                  setNewProfileDesc("");
                  setShowCreateForm(false);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold py-2 rounded-lg transition-all"
              >
                Crear Perfil
              </button>
            </div>
          ) : (
            <>
              {/* Selector de Perfil a editar */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setEditingProfile(p)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border shrink-0 transition-all ${
                      editingProfile?.id === p.id
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

              {editingProfile && (
                <div className="flex flex-col gap-4 border-t border-gray-900 pt-4">
                  {/* Información y acciones del perfil */}
                  <div className="flex justify-between items-start bg-black/10 p-3 rounded-xl border border-gray-900/60">
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white">{editingProfile.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{editingProfile.description || "Sin descripción."}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={handleSaveProfilePermissions}
                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Guardar
                      </button>
                      {editingProfile.name !== "Administrador del Sistema" && (
                        <button
                          onClick={() => handleDeleteProfile(editingProfile.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de Permisos Atómicos */}
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Permisos por Módulo</p>
                    
                    {permissions.map(perm => {
                      const profilePerm = editingProfile.permissions_detail?.find((pd: any) => pd.permission === perm.id);
                      const hasPerm = !!profilePerm;

                      return (
                        <div key={perm.id} className="bg-black/20 border border-gray-900 rounded-xl p-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={hasPerm}
                                onChange={() => handleTogglePermissionInProfile(perm.id)}
                                className="custom-checkbox shrink-0"
                              />
                              <div className="text-left">
                                <h4 className="text-xs font-semibold text-white">{perm.code}</h4>
                                <p className="text-[10px] text-gray-500">{perm.description}</p>
                              </div>
                            </div>
                            <span className="bg-gray-800/80 text-gray-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                              {perm.module}
                            </span>
                          </div>

                          {/* Ajuste de Alcance (RF 1.4) */}
                          {hasPerm && (
                            <div className="flex items-center justify-between border-t border-gray-800/60 pt-2 text-[10px]">
                              <span className="text-gray-400">Alcance de datos:</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdatePermissionScope(perm.id, "propios")}
                                  className={`px-2.5 py-1 rounded transition-all ${
                                    profilePerm.scope === "propios"
                                      ? "bg-amber-500 text-black font-bold"
                                      : "bg-gray-900 text-gray-500 hover:text-white"
                                  }`}
                                >
                                  Propios
                                </button>
                                <button
                                  onClick={() => handleUpdatePermissionScope(perm.id, "todos")}
                                  className={`px-2.5 py-1 rounded transition-all ${
                                    profilePerm.scope === "todos"
                                      ? "bg-amber-500 text-black font-bold"
                                      : "bg-gray-900 text-gray-500 hover:text-white"
                                  }`}
                                >
                                  Todos
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
