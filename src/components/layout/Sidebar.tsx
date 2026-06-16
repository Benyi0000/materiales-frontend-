import React from "react";
import { Building2, Bot, ShieldCheck, Users, Clock, ChevronRight, Package, Store, X, LayoutDashboard, FileText, PackageX, Image as ImageIcon, Ticket, CreditCard, Users2, Sparkles } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  isPremium: boolean;
  activeTab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory" | "sales" | "g_dashboard" | "g_reportes" | "g_stock" | "g_banners" | "g_promos" | "g_planes" | "g_subs" | "g_embeddings";
  setActiveTab: (tab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory" | "sales" | "g_dashboard" | "g_reportes" | "g_stock" | "g_banners" | "g_promos" | "g_planes" | "g_subs" | "g_embeddings") => void;
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

  const canViewCatalog = currentUser?.is_superuser || (
    currentUser?.active_permissions &&
    typeof currentUser.active_permissions === "object" &&
    "catalogo.ver_catalogo" in currentUser.active_permissions
  );

  const canViewSales = currentUser?.is_superuser || (
    currentUser?.active_permissions &&
    typeof currentUser.active_permissions === "object" &&
    "pedidosventas.ver" in currentUser.active_permissions
  );

  const gestionPerm = (p: string) =>
    currentUser?.is_superuser || (
      currentUser?.active_permissions &&
      typeof currentUser.active_permissions === "object" &&
      p in currentUser.active_permissions
    );

  const permissions = currentUser?.active_permissions && typeof currentUser.active_permissions === "object"
    ? Object.keys(currentUser.active_permissions)
    : [];

  const canManageProfiles = currentUser?.is_superuser || 
    permissions.some(p => p.includes("gestionar_perfiles") || p.includes("crear_perfil") || p.includes("editar_perfil") || p.includes("asignar_perfil")) || 
    isAdmin;

  const canCreateUser = currentUser?.is_superuser || 
    permissions.some(p => p.includes("alta_usuario") || p.includes("crear_usuario"));

  const showManageProfiles = canManageProfiles;
  const showCreateUser = canCreateUser && !showManageProfiles;
  const showAudits = isAdmin;

  type Item = { tab: typeof activeTab; label: string; icon: React.ReactNode; show: boolean; tutor?: boolean };
  const groups: { title: string; items: Item[] }[] = [
    { title: "Tienda", items: [
      { tab: "catalog", label: "Catálogo E-commerce", icon: <Building2 size={18} />, show: !!canViewCatalog },
      { tab: "tutor", label: "Tutor Visual IA", icon: <Bot size={18} />, show: true, tutor: true },
    ]},
    { title: "Inventario", items: [
      { tab: "inventory", label: "Gestión de Inventario", icon: <Package size={18} />, show: !!canManageCatalog },
      { tab: "g_stock", label: "Stock bajo", icon: <PackageX size={18} />, show: !!gestionPerm("gestion.ver_stock_bajo") },
    ]},
    { title: "Ventas", items: [
      { tab: "sales", label: "Ventas", icon: <Store size={18} />, show: !!canViewSales },
      { tab: "g_dashboard", label: "Dashboard de ventas", icon: <LayoutDashboard size={18} />, show: !!gestionPerm("gestion.ver_dashboard") },
      { tab: "g_reportes", label: "Reportes de pedidos", icon: <FileText size={18} />, show: !!gestionPerm("gestion.exportar_reportes") },
    ]},
    { title: "Marketing", items: [
      { tab: "g_banners", label: "Banners", icon: <ImageIcon size={18} />, show: !!gestionPerm("gestion.gestionar_banners") },
      { tab: "g_promos", label: "Promociones", icon: <Ticket size={18} />, show: !!gestionPerm("gestion.gestionar_promociones") },
    ]},
    { title: "Suscripciones", items: [
      { tab: "g_planes", label: "Planes", icon: <CreditCard size={18} />, show: !!gestionPerm("gestion.gestionar_planes") },
      { tab: "g_subs", label: "Suscripciones", icon: <Users2 size={18} />, show: !!gestionPerm("gestion.gestionar_suscripciones") },
    ]},
    { title: "Catálogo IA", items: [
      { tab: "g_embeddings", label: "Embeddings (IA)", icon: <Sparkles size={18} />, show: !!gestionPerm("gestion.gestionar_embeddings") },
    ]},
    { title: "Seguridad y Usuarios", items: [
      { tab: "profiles", label: "Gestión de Perfiles", icon: <ShieldCheck size={18} />, show: !!showManageProfiles },
      { tab: "create-user", label: "Alta de Usuario", icon: <Users size={18} />, show: !!showCreateUser },
      { tab: "audits", label: "Logs de Auditoría", icon: <Clock size={18} />, show: !!showAudits },
    ]},
  ];

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
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white border-r border-[#e5e7eb] shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header del sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#e5e7eb] shrink-0">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CraftIAr" className="h-9 w-9 object-contain" />
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

        {/* Opciones de navegación (agrupadas por sección) */}
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {groups.map((group, gi) => {
            const items = group.items.filter((i) => i.show);
            if (items.length === 0) return null;
            return (
              <div key={group.title}>
                <p className={`text-[10px] font-bold text-[#9ca3af] px-3 py-2 uppercase tracking-wider text-left ${gi === 0 ? "" : "mt-3"}`}>{group.title}</p>
                {items.map((item) => (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => handleTabClick(item.tab)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.tab
                        ? "bg-[#fff7ed] text-[#E8612D] border border-[#E8612D]/20"
                        : "text-[#6b7280] hover:bg-gray-50 hover:text-[#1a1a2e]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.tutor ? (
                      isPremium
                        ? <span className="bg-[#E8612D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">PREMIUM</span>
                        : <span className="text-[#9ca3af] text-[9px]">🔒</span>
                    ) : (
                      <ChevronRight size={14} className="opacity-50" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
