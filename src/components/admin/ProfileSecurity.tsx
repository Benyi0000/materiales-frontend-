import React, { useState, useMemo } from "react";
import { ShieldCheck, Users, Plus, Shield, Search, Settings, Trash2, Save, User as UserIcon, X, Check, AlertTriangle } from "lucide-react";
import { useNavigationGuard } from "@/hooks/useNavigationGuard";
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
  scope_aplica?: boolean;
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

// Permisos de cara al cliente (el resto son de gestión interna/staff)
const CLIENT_CODES = new Set([
  "catalogo.ver_catalogo", "catalogo.busqueda_semantica", "pedidos.ver",
  "carrito.gestionar", "carrito.checkout", "tutor.acceder", "tutor.ver_historial",
]);

const moduleLabel = (raw: string) => {
  const m = (raw || "").toLowerCase().trim();
  if (m === "catalog" || m === "catalogo") return "Catálogo";
  if (m === "orders") return "Pedidos";
  if (m === "ventas") return "Ventas";
  if (m === "cart") return "Carrito";
  if (m === "tutor") return "Tutor IA";
  if (m === "gestion") return "Gestión Interna";
  if (m === "admin") return "Administración";
  if (m === "auth") return "Autenticación";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

// Toggle component
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${checked ? 'bg-[#E8612D]' : 'bg-gray-300'}`}
  >
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-4' : ''}`} />
  </div>
);

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
  const [activeTab, setActiveTab] = useState<"users" | "profiles">("users");
  const [userSearch, setUserSearch] = useState("");
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileDesc, setNewProfileDesc] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [profileSearch, setProfileSearch] = useState("");
  const [permSearch, setPermSearch] = useState("");

  // Estado local para agrupar cambios de asignación antes de guardar
  const [localAssignments, setLocalAssignments] = useState<{ [profileId: number]: boolean }>({});
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  React.useEffect(() => {
    if (selectedAdminUser) {
      const initial: { [profileId: number]: boolean } = {};
      profiles.forEach(p => {
        const asg = (selectedAdminUser.assignments || []).find((a: any) => a.profile === p.id && a.is_active && !a.has_expired);
        initial[p.id] = !!asg;
      });
      setLocalAssignments(initial);
    } else {
      setLocalAssignments({});
    }
  }, [selectedAdminUser, profiles]);

  const hasUnsavedAssignments = useMemo(() => {
    if (!selectedAdminUser) return false;
    return profiles.some(p => {
      const asg = (selectedAdminUser.assignments || []).find((a: any) => a.profile === p.id && a.is_active && !a.has_expired);
      const original = !!asg;
      return localAssignments[p.id] !== original;
    });
  }, [localAssignments, selectedAdminUser, profiles]);

  const pendingTargetRef = React.useRef<HTMLElement | null>(null);

  const { bypassAndNavigate } = useNavigationGuard({
    isDirty: hasUnsavedAssignments,
    onIntercept: (target) => {
      pendingTargetRef.current = target;
      setSaveModalState({
        isOpen: true,
        type: "discard_warning",
        message: "Tienes cambios sin guardar en la asignación de perfiles. ¿Estás seguro de querer descartarlos y salir de esta pantalla?"
      });
    }
  });

  // Estado para el Modal Personalizado de Guardado y Advertencias
  const [saveModalState, setSaveModalState] = useState<{isOpen: boolean, type: "confirm" | "success" | "error" | "discard_warning", message: string}>({
    isOpen: false,
    type: "confirm",
    message: ""
  });

  const requestSaveAssignments = () => {
    if (!selectedAdminUser) return;
    setSaveModalState({
      isOpen: true,
      type: "confirm",
      message: `¿Estás seguro de que deseas confirmar y aplicar las nuevas asignaciones de perfiles para ${selectedAdminUser.first_name} ${selectedAdminUser.last_name}?`
    });
  };

  const confirmDiscardAndNavigate = () => {
    setSaveModalState({ ...saveModalState, isOpen: false });
    // Descartar cambios locales reseteándolos
    setLocalAssignments({});
    
    // Ejecutar el clic original bypassando el interceptor
    if (pendingTargetRef.current) {
      bypassAndNavigate(pendingTargetRef.current);
      pendingTargetRef.current = null;
    }
  };

  const executeSaveAssignments = async () => {
    if (!selectedAdminUser) return;
    
    setIsSavingAssignments(true);
    try {
      for (const p of profiles) {
        const asg = (selectedAdminUser.assignments || []).find((a: any) => a.profile === p.id && a.is_active && !a.has_expired);
        const original = !!asg;
        if (localAssignments[p.id] !== original) {
          await toggleUserProfile(selectedAdminUser, p.id);
        }
      }
      setSaveModalState({
        isOpen: true,
        type: "success",
        message: "Las asignaciones se guardaron correctamente en la base de datos."
      });
    } catch (err) {
      console.error(err);
      setSaveModalState({
        isOpen: true,
        type: "error",
        message: "Ocurrió un error inesperado al intentar guardar las asignaciones."
      });
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name} ${u.username}`.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  // Permisos agrupados por categoría (Clientes / Gestión Interna) y módulo, con filtro de búsqueda
  const categorized = useMemo(() => {
    const term = permSearch.toLowerCase().trim();
    const result: { [cat: string]: { [mod: string]: PermissionAtom[] } } = { "Clientes": {}, "Gestión Interna": {} };
    permissions.forEach(p => {
      if (term && !(p.code.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term))) return;
      const cat = CLIENT_CODES.has(p.code) ? "Clientes" : "Gestión Interna";
      const mod = moduleLabel(p.module);
      if (!result[cat][mod]) result[cat][mod] = [];
      result[cat][mod].push(p);
    });
    return result;
  }, [permissions, permSearch]);

  const filteredProfiles = useMemo(() => {
    const term = profileSearch.toLowerCase().trim();
    if (!term) return profiles;
    return profiles.filter(p =>
      p.name.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term));
  }, [profiles, profileSearch]);

  return (
    <div className="flex-grow flex flex-col gap-6 text-left max-w-7xl mx-auto w-full animate-[fadeIn_0.3s_ease]">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-[#1a1a2e]">
          <div className="p-2 bg-[#E8612D]/10 rounded-xl">
            <ShieldCheck className="text-[#E8612D]" size={28} />
          </div>
          <span>Seguridad y Accesos</span>
        </h2>
        <p className="text-sm text-[#6b7280] mt-2">
          Gestiona los usuarios, crea perfiles personalizados y define reglas de acceso precisas al sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 px-6 text-sm font-semibold transition-all ${
            activeTab === "users" 
              ? "border-b-2 border-[#E8612D] text-[#E8612D]" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} /> Asignar Perfiles a Usuarios
          </div>
        </button>
        <button
          onClick={() => setActiveTab("profiles")}
          className={`pb-3 px-6 text-sm font-semibold transition-all ${
            activeTab === "profiles" 
              ? "border-b-2 border-[#E8612D] text-[#E8612D]" 
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Shield size={16} /> Configurar Perfiles del Sistema
          </div>
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeTab === "users" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Users List */}
          <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[700px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-[#1a1a2e]">Directorio de Usuarios</h3>
              <button
                onClick={() => setShowCreateUserForm(true)}
                className="bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white p-2 rounded-lg transition-all shadow-sm"
                title="Nuevo Usuario"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
              {filteredUsers.length > 0 ? filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedAdminUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedAdminUser?.id === u.id
                      ? "bg-[#fff7ed] border border-[#E8612D]/30 shadow-sm"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                    selectedAdminUser?.id === u.id ? "bg-[#E8612D] text-white" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    <UserIcon size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-semibold truncate ${selectedAdminUser?.id === u.id ? "text-[#E8612D]" : "text-[#1a1a2e]"}`}>
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                  </div>
                </button>
              )) : (
                <p className="p-6 text-center text-sm text-gray-400 italic">No se encontraron usuarios.</p>
              )}
            </div>
          </div>

          {/* Right Column: User Profile Assignments */}
          <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col max-h-[700px]">
            <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-[#1a1a2e] text-lg">
                  {selectedAdminUser 
                    ? `Perfiles Asignados a ${selectedAdminUser.first_name}`
                    : "Selecciona un usuario"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Activa o desactiva los perfiles para este usuario y presiona Guardar.</p>
              </div>
              {selectedAdminUser && (
                <button
                  onClick={requestSaveAssignments}
                  disabled={!hasUnsavedAssignments || isSavingAssignments}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm ${
                    hasUnsavedAssignments 
                      ? "bg-[#E8612D] hover:bg-[#d4551f] text-white cursor-pointer" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Save size={16} /> {isSavingAssignments ? "Guardando..." : "Guardar Asignaciones"}
                </button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {selectedAdminUser ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {profiles.map(profile => {
                    const isAssigned = !!localAssignments[profile.id];
                    
                    return (
                      <div key={profile.id} className={`flex flex-col p-4 rounded-xl border transition-all ${
                        isAssigned ? "border-[#E8612D]/40 bg-[#fff7ed]" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-[#1a1a2e]">{profile.name}</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-snug">{profile.description}</p>
                          </div>
                          <Toggle 
                            checked={isAssigned} 
                            onChange={() => setLocalAssignments(prev => ({...prev, [profile.id]: !prev[profile.id]}))} 
                          />
                        </div>
                        
                        <div className="mt-auto border-t border-gray-100 pt-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha Exp.</span>
                          <input
                            type="date"
                            value={profileExpirations[profile.id] || ""}
                            onChange={(e) => {
                              setProfileExpirations({
                                ...profileExpirations,
                                [profile.id]: e.target.value
                              });
                            }}
                            className="bg-transparent border border-gray-200 text-xs rounded-lg px-2 py-1 text-[#1a1a2e] outline-none focus:border-[#E8612D] focus:ring-1 focus:ring-[#E8612D]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <Users size={48} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Selecciona un usuario de la lista de la izquierda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Profiles */}
      {activeTab === "profiles" && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Profiles List */}
          <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[700px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-[#1a1a2e]">Listado de Perfiles</h3>
              <button
                onClick={() => {
                  setShowCreateForm(!showCreateForm);
                  setEditingProfile(null as any);
                }}
                className={`px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-2 ${
                  showCreateForm ? "bg-gray-200 text-gray-700" : "bg-[#1a1a2e] text-white hover:bg-black"
                }`}
              >
                {showCreateForm ? (
                  <span className="text-xs font-bold">Cancelar</span>
                ) : (
                  <>
                    <Plus size={14} /> <span className="text-xs font-bold">Crear</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar perfil..."
                  value={profileSearch}
                  onChange={e => setProfileSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
              {filteredProfiles.length === 0 && (
                <p className="p-6 text-center text-sm text-gray-400 italic">No se encontraron perfiles.</p>
              )}
              {filteredProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setEditingProfile(p);
                    setShowCreateForm(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    editingProfile?.id === p.id && !showCreateForm
                      ? "bg-blue-50 border border-blue-200 shadow-sm"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                    editingProfile?.id === p.id && !showCreateForm ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}>
                    <Shield size={18} />
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-semibold truncate ${editingProfile?.id === p.id && !showCreateForm ? "text-blue-700" : "text-[#1a1a2e]"}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Profile Editor */}
          <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col max-h-[700px]">
            {showCreateForm ? (
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-[#1a1a2e]">Crear Nuevo Perfil</h3>
                  <p className="text-sm text-gray-500 mt-1">Define un nuevo rol con permisos personalizados.</p>
                </div>
                <div className="flex flex-col gap-5 max-w-lg">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#1a1a2e]">Nombre del Perfil</label>
                    <input
                      type="text"
                      placeholder="Ej: Encargado de Despacho"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-[#1a1a2e]">Descripción</label>
                    <textarea
                      placeholder="Breve explicación de las responsabilidades de este perfil..."
                      value={newProfileDesc}
                      onChange={(e) => setNewProfileDesc(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] h-32 resize-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleCreateProfile(newProfileName, newProfileDesc);
                      setNewProfileName("");
                      setNewProfileDesc("");
                      setShowCreateForm(false);
                    }}
                    className="bg-[#E8612D] hover:bg-[#d4551f] text-white text-sm font-bold py-3 rounded-xl transition-all mt-4 shadow-md hover:shadow-lg"
                  >
                    Guardar Nuevo Perfil
                  </button>
                </div>
              </div>
            ) : editingProfile ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Profile Header */}
                <div className="p-6 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shrink-0">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1a1a2e]">{editingProfile.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{editingProfile.description || "Sin descripción."}</p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {editingProfile.name !== "Administrador del Sistema" && (
                      <button
                        onClick={() => handleDeleteProfile(editingProfile.id)}
                        className="bg-white border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <Trash2 size={16} /> <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    )}
                    <button
                      onClick={handleSaveProfilePermissions}
                      className="bg-[#E8612D] hover:bg-[#d4551f] text-white px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Save size={16} /> Guardar Cambios
                    </button>
                  </div>
                </div>

                {/* Profile Permissions */}
                <div className="p-6 overflow-y-auto bg-gray-50/30 custom-scrollbar flex-1">
                  <p className="text-sm text-gray-600 mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
                    <strong>Instrucciones:</strong> Enciende los permisos correspondientes y ajusta su nivel de alcance. <em>Propios</em> limita al usuario a ver sus propios registros, <em>Todos</em> permite acceso global.
                  </p>
                  
                  {/* Buscador de permisos */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar permiso por código o descripción..."
                      value={permSearch}
                      onChange={e => setPermSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-10">
                    {(["Clientes", "Gestión Interna"] as const).map(cat => {
                      const mods = categorized[cat];
                      const modNames = Object.keys(mods).sort();
                      if (modNames.length === 0) return null;
                      return (
                      <div key={cat} className="flex flex-col gap-6">
                        <span className={`self-start text-xs font-bold px-3 py-1.5 rounded-full ${cat === "Clientes" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-[#E8612D]"}`}>
                          {cat === "Clientes" ? "🛒 Permisos para Clientes" : "🛠️ Permisos para Gestión Interna"}
                        </span>
                        {modNames.map(moduleName => (
                      <div key={moduleName} className="flex flex-col gap-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-2">
                          <Settings size={14} /> Módulo: {moduleName}
                        </h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          {mods[moduleName].map(perm => {
                            const profilePerm = editingProfile.permissions_detail?.find((pd: any) => pd.permission === perm.id);
                            const hasPerm = !!profilePerm;

                            return (
                              <div key={perm.id} className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-300 ${
                                hasPerm ? "border-[#E8612D]/40 bg-white shadow-sm ring-1 ring-[#E8612D]/10" : "border-gray-200 bg-white/50 hover:bg-white"
                              }`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h5 className={`text-sm font-bold ${hasPerm ? 'text-[#1a1a2e]' : 'text-gray-600'}`}>{perm.code}</h5>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{perm.description}</p>
                                  </div>
                                  <Toggle 
                                    checked={hasPerm} 
                                    onChange={() => handleTogglePermissionInProfile(perm.id)} 
                                  />
                                </div>
                                
                                {hasPerm && perm.scope_aplica !== false && (
                                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2 animate-[fadeIn_0.2s_ease]">
                                    <span className="text-xs font-semibold text-gray-500">Nivel de Alcance:</span>
                                    <div className="flex bg-gray-100 border border-gray-200 rounded-lg p-1">
                                      <button
                                        onClick={() => handleUpdatePermissionScope(perm.id, "propios")}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                          profilePerm.scope === "propios"
                                            ? "bg-white text-[#E8612D] shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                        }`}
                                      >
                                        Propios
                                      </button>
                                      <button
                                        onClick={() => handleUpdatePermissionScope(perm.id, "todos")}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                          profilePerm.scope === "todos"
                                            ? "bg-white text-[#E8612D] shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
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
                        ))}
                      </div>
                      );
                    })}
                    {Object.keys(categorized["Clientes"]).length === 0 && Object.keys(categorized["Gestión Interna"]).length === 0 && (
                      <p className="text-center text-sm text-gray-400 italic py-8">No se encontraron permisos.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <Shield size={48} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium">Selecciona un perfil de la lista para gestionar sus accesos.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Alta de Usuario */}
      {showCreateUserForm && activeTab === "users" && (
        <div className="fixed inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl relative text-left flex flex-col max-h-[95vh]">
            <button
              onClick={() => setShowCreateUserForm(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-[#1a1a2e] transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="shrink-0 mb-6">
              <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2 flex items-center gap-2">
                <Users size={24} className="text-[#E8612D]" /> Nuevo Usuario
              </h3>
              <p className="text-sm text-gray-500">Da de alta un nuevo miembro de tu equipo en la plataforma.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 pb-2 custom-scrollbar -mr-2">
              <UserCreateForm 
                profiles={profiles}
                onSubmit={handleCreateUserSubmit}
                onCancel={() => setShowCreateUserForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación / Éxito / Error para Guardado */}
      {saveModalState.isOpen && (
        <div className="fixed inset-0 bg-[#1a1a2e]/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative text-center flex flex-col items-center">
            {saveModalState.type === "confirm" && (
              <div className="bg-[#fff7ed] text-[#E8612D] p-5 rounded-full mb-5">
                <ShieldCheck size={40} />
              </div>
            )}
            {saveModalState.type === "discard_warning" && (
              <div className="bg-orange-50 text-orange-500 p-5 rounded-full mb-5">
                <AlertTriangle size={40} />
              </div>
            )}
            {saveModalState.type === "success" && (
              <div className="bg-green-50 text-green-600 p-5 rounded-full mb-5">
                <Check size={40} />
              </div>
            )}
            {saveModalState.type === "error" && (
              <div className="bg-red-50 text-red-600 p-5 rounded-full mb-5">
                <X size={40} />
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-[#1a1a2e] mb-2">
              {saveModalState.type === "confirm" ? "Confirmar Acción" : 
               saveModalState.type === "discard_warning" ? "Cambios sin guardar" :
               saveModalState.type === "success" ? "¡Éxito!" : "Error"}
            </h3>
            <p className="text-sm text-gray-500 mb-8 px-2 leading-relaxed">
              {saveModalState.message}
            </p>
            
            <div className="flex gap-3 w-full">
              {saveModalState.type === "confirm" ? (
                <>
                  <button
                    onClick={() => setSaveModalState({...saveModalState, isOpen: false})}
                    className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeSaveAssignments}
                    disabled={isSavingAssignments}
                    className="flex-1 px-4 py-3.5 bg-[#E8612D] hover:bg-[#d4551f] text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingAssignments ? "Guardando..." : "Confirmar"}
                  </button>
                </>
              ) : saveModalState.type === "discard_warning" ? (
                <>
                  <button
                    onClick={() => setSaveModalState({...saveModalState, isOpen: false})}
                    className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1a1a2e] rounded-xl text-sm font-bold transition-all shadow-sm border border-gray-200"
                  >
                    Quedarme
                  </button>
                  <button
                    onClick={confirmDiscardAndNavigate}
                    className="flex-1 px-4 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-md"
                  >
                    Descartar y Salir
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setSaveModalState({...saveModalState, isOpen: false});
                    if (saveModalState.type === "success") {
                       setLocalAssignments({}); // Resetear localAssignments para re-sincronizar
                    }
                  }}
                  className="w-full px-4 py-3.5 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white rounded-xl text-sm font-bold transition-all shadow-md"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
