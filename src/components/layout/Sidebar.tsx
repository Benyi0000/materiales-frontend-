import React from "react";
import { Building2, Bot, ShieldCheck, Users, Clock, Lock, ChevronRight, Package } from "lucide-react";

interface SidebarProps {
  isAdmin: boolean;
  isPremium: boolean;
  activeTab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory";
  setActiveTab: (tab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory") => void;
  currentUser: any;
  togglePremiumSubscription: () => void;
}

export default function Sidebar({
  isAdmin,
  isPremium,
  activeTab,
  setActiveTab,
  currentUser,
  togglePremiumSubscription,
}: SidebarProps) {
  const canManageCatalog = currentUser?.is_superuser || (
    currentUser?.active_permissions &&
    typeof currentUser.active_permissions === "object" &&
    ("catalogo.crear_producto" in currentUser.active_permissions ||
     "catalogo.editar_producto" in currentUser.active_permissions)
  );

  return (
    <aside className="w-64 border-r border-[rgba(255,255,255,0.06)] bg-gray-950/20 p-4 flex flex-col gap-2">
      <p className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider text-left">Módulos del MVP</p>
      
      {!isAdmin && (
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "catalog" 
              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
              : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
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
        onClick={() => setActiveTab("tutor")}
        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
          activeTab === "tutor" 
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
            : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <Bot size={18} />
          <span>Tutor Visual IA</span>
        </div>
        {isPremium ? (
          <span className="bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">PREMIUM</span>
        ) : (
          <Lock size={12} className="text-gray-500" />
        )}
      </button>

      {canManageCatalog && (
        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === "inventory" 
              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
              : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
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
          <p className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider mt-4 text-left">Usuarios</p>
          
          <button
            type="button"
            onClick={() => setActiveTab("profiles")}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "profiles" 
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
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
            onClick={() => setActiveTab("create-user")}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "create-user" 
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
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
            onClick={() => setActiveTab("audits")}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "audits" 
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
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

      {/* ESTADO DE SUSCRIPCIÓN DEL USUARIO */}
      {currentUser && (
        <div className="mt-auto p-4 rounded-xl glass-panel text-left flex flex-col gap-2 border border-white/5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-400">Plan actual:</span>
            <span className={isPremium ? "text-amber-500 font-bold" : "text-gray-400"}>
              {isPremium ? "Premium" : "Estándar"}
            </span>
          </div>
          <p className="text-[10px] text-gray-500">
            {isPremium 
              ? "Tienes acceso completo al Tutor Visual IA." 
              : "Accede al Tutor Visual IA obteniendo el perfil de suscripción correspondiente."}
          </p>
        </div>
      )}
    </aside>
  );
}
