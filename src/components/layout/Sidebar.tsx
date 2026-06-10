import React from "react";
import { Building2, Bot, ShieldCheck, Users, Clock, ChevronRight, Package, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isPremium: boolean;
  activeTab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory";
  setActiveTab: (tab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory") => void;
  currentUser: any;
}

export default function Sidebar({
  isOpen,
  onClose,
  isAdmin,
  isPremium,
  activeTab,
  setActiveTab,
  currentUser,
}: SidebarProps) {
  const canManageCatalog = currentUser?.is_superuser || (
    currentUser?.active_permissions &&
    typeof currentUser.active_permissions === "object" &&
    ("catalogo.crear_producto" in currentUser.active_permissions ||
     "catalogo.editar_producto" in currentUser.active_permissions)
  );

  const handleTabClick = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-[#e5e7eb] shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1a1a2e]">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6b7280] hover:text-[#E8612D] hover:bg-orange-50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Opciones de navegación */}
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-[#9ca3af] px-3 py-2 uppercase tracking-wider text-left">Módulos del Sistema</p>
          
          {!isAdmin && (
            <button
              type="button"
              onClick={() => handleTabClick("catalog")}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "catalog" 
                  ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                  : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={18} />
                <span>Catálogo E-commerce</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleTabClick("tutor")}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tutor" 
                ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot size={18} />
              <span>Tutor Visual IA</span>
            </div>
            {isPremium ? (
              <span className="bg-[#E8612D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PREMIUM</span>
            ) : (
              <span className="text-[#9ca3af] text-[9px]">🔒</span>
            )}
          </button>

          {canManageCatalog && (
            <button
              type="button"
              onClick={() => handleTabClick("inventory")}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "inventory" 
                  ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                  : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span>Gestión de Inventario</span>
              </div>
              <ChevronRight size={14} className="opacity-50" />
            </button>
          )}

          {isAdmin && (
            <>
              <p className="text-[10px] font-bold text-[#9ca3af] px-3 py-2 uppercase tracking-wider mt-4 text-left">Usuarios</p>
              
              <button
                type="button"
                onClick={() => handleTabClick("profiles")}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "profiles" 
                    ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                    : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} />
                  <span>Gestión de perfiles</span>
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("create-user")}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "create-user" 
                    ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                    : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span>Alta de usuario</span>
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </button>

              <button
                type="button"
                onClick={() => handleTabClick("audits")}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "audits" 
                    ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20" 
                    : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} />
                  <span>Logs de Auditoría</span>
                </div>
                <ChevronRight size={14} className="opacity-50" />
              </button>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
