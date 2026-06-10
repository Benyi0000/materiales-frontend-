/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";


// Componentes Modularizados
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import CatalogView from "@/components/catalog/CatalogView";
import TutorVisualChat from "@/components/tutor/TutorVisualChat";
import ProfileSecurity from "@/components/admin/ProfileSecurity";
import AuditLogTable from "@/components/admin/AuditLogTable";
import UserCreateForm from "@/components/admin/UserCreateForm";
import InventoryPanel from "@/components/catalog/InventoryPanel";
import PublicLanding from "@/components/public/PublicLanding";

// URL Base de la API de Django
const API_BASE_URL = "http://localhost:8000/api";

export default function Dashboard() {
  const router = useRouter();

  // ----------------------------------------------------
  // ESTADOS PRINCIPALES
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<"catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory">("catalog");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  // Usuario Logueado en el Frontend
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Estados de ABM Roles en el Panel de Administrador
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null);
  const [profileExpirations, setProfileExpirations] = useState<{ [key: number]: string }>({});

  // Estado para la Edición de Permisos de Perfiles Dinámicos
  const [editingProfile, setEditingProfile] = useState<any>(null);

  // Estado de la modal de creación de usuarios internos
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  // Estado de conexión a la API Django
  const [apiOnline, setApiOnline] = useState(false);
  const [loadingAPI, setLoadingAPI] = useState(false);

  // ----------------------------------------------------
  // CONEXIÓN CON EL BACKEND
  // ----------------------------------------------------
  const checkBackendAPI = async () => {
    setLoadingAPI(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Sin token: mostrar la landing pública en lugar de redirigir al login
      setIsAuthenticated(false);
      setLoadingAPI(false);
      return;
    }
    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // 1. Cargar perfil del usuario logueado
      const profUserRes = await fetch(`${API_BASE_URL}/users/auth/profile/`, { headers });
      if (profUserRes.ok) {
        const userData = await profUserRes.json();
        setCurrentUser(userData);
        setApiOnline(true);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setIsAuthenticated(false);
        return;
      }

      // 2. Cargar catálogo de productos
      const prodRes = await fetch(`${API_BASE_URL}/catalog/products/`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData);
      }

      // 3. Cargar perfiles
      const profRes = await fetch(`${API_BASE_URL}/users/admin/profiles/`, { headers });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfiles(profData);
        if (profData.length > 0) {
          setEditingProfile(profData[0]);
        }
      }

      // 4. Cargar permisos
      const permRes = await fetch(`${API_BASE_URL}/users/admin/permissions/`, { headers });
      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData);
      }

      // 5. Cargar usuarios (ABM)
      const userRes = await fetch(`${API_BASE_URL}/users/admin/users/`, { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData);
        if (userData.length > 0) {
          setSelectedAdminUser(userData[0]);
        }
      }

      // 6. Cargar logs de auditoría
      const auditRes = await fetch(`${API_BASE_URL}/users/admin/audit-logs/`, { headers });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }
    } catch (err) {
      console.error("Error connecting to backend API:", err);
      setApiOnline(false);
    } finally {
      setLoadingAPI(false);
    }
  };

  useEffect(() => {
    checkBackendAPI();
  }, []);

  // Sincronizar el estado premium de la sesión local según los permisos activos del usuario actual
  useEffect(() => {
    if (!currentUser) {
      setIsPremium(false);
      return;
    }
    const hasPremiumPermission = currentUser.active_permissions && 
      typeof currentUser.active_permissions === "object" &&
      "tutor.acceder" in currentUser.active_permissions;
    const isSuper = currentUser.is_superuser;
    setIsPremium(hasPremiumPermission || isSuper);
  }, [currentUser]);

  // Sincronizar el estado de administrador de la sesión local
  const isAdmin = currentUser && (
    currentUser.is_superuser ||
    (currentUser.assignments || []).some(
      (asg: any) => asg.profile_name === "Administrador del Sistema" && asg.is_active && !asg.has_expired
    )
  );

  // Redirigir al administrador de la pestaña catálogo a la pestaña roles al iniciar sesión
  useEffect(() => {
    if (isAdmin && activeTab === "catalog") {
      setActiveTab("profiles");
    }
  }, [isAdmin, activeTab]);

  // ----------------------------------------------------
  // LÓGICA DEL CARRITO
  // ----------------------------------------------------
  const addToCart = (product: any, quantity: number = 1) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
  };

  const updateCartQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.product.id !== productId));
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.min(newQty, item.product.stock) }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const itemsPayload = cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/orders/orders/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          items: itemsPayload
        })
      });
      if (res.ok) {
        alert("¡Pedido realizado con éxito! Se ha descontado el stock de los productos. Se disparó la tarea asíncrona de confirmación por email en Celery.");
        clearCart();
        checkBackendAPI(); // Refrescar stock de productos y auditorías
      } else {
        const errData = await res.json();
        alert(`Error al realizar el pedido: ${JSON.stringify(errData)}`);
      }
    } catch (err) {
      alert("Error de conexión al procesar la compra.");
    }
  };

  // ----------------------------------------------------
  // LÓGICA DE SUSCRIPCIÓN PREMIUM (REAL)
  // ----------------------------------------------------
  const togglePremiumSubscription = async () => {
    if (!currentUser) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const method = isPremium ? "DELETE" : "POST";
      const res = await fetch(`${API_BASE_URL}/orders/subscription/`, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert(isPremium ? "Suscripción cancelada con éxito." : "¡Gracias por suscribirte al Plan Premium!");
        checkBackendAPI(); // Volver a cargar el perfil para actualizar assignments y permisos
      } else {
        const errData = await res.json();
        alert(`Error al gestionar suscripción: ${errData.detail || "Error desconocido"}`);
      }
    } catch (err) {
      alert("Error de conexión al procesar la suscripción.");
    }
  };

  // ----------------------------------------------------
  // ACCIONES DE ADMINISTRACIÓN: ASIGNACIÓN DE ROLES (RF 6)
  // ----------------------------------------------------
  const toggleUserProfile = async (user: any, profileId: number) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const existing = (user.assignments || []).find(
      (asg: any) => asg.profile === profileId && asg.is_active && !asg.has_expired
    );
    let actionType: "assign" | "revoke" = existing ? "revoke" : "assign";
    const expirationDate = profileExpirations[profileId];
    const expiresAt = expirationDate ? new Date(expirationDate).toISOString() : null;

    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/users/${user.id}/profiles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: profileId,
          action: actionType,
          expires_at: expiresAt
        })
      });
      if (res.ok) {
        checkBackendAPI();
        alert(`Perfil '${profile.name}' ${actionType === 'assign' ? 'asignado' : 'revocado'} con éxito.`);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "No se pudo actualizar el perfil."}`);
      }
    } catch (err) {
      alert("Error de conexión al asignar perfil.");
    }
  };

  // ----------------------------------------------------
  // ACCIONES DE CONFIGURACIÓN DINÁMICA DE PERFILES (RF 1.2, 6.2)
  // ----------------------------------------------------
  const handleTogglePermissionInProfile = (permissionId: number) => {
    if (!editingProfile) return;

    const exists = (editingProfile.permissions_detail || []).some((pd: any) => pd.permission === permissionId);
    let updatedPermissions = [...(editingProfile.permissions_detail || [])];

    if (exists) {
      updatedPermissions = updatedPermissions.filter((pd: any) => pd.permission !== permissionId);
    } else {
      const perm = permissions.find(p => p.id === permissionId);
      if (perm) {
        updatedPermissions.push({
          permission: permissionId,
          permission_code: perm.code,
          scope: "propios",
          module: perm.module
        });
      }
    }

    const updatedProfile = { ...editingProfile, permissions_detail: updatedPermissions };
    setEditingProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? updatedProfile : p));
  };

  const handleUpdatePermissionScope = (permissionId: number, newScope: "propios" | "todos") => {
    if (!editingProfile) return;

    const updatedPermissions = (editingProfile.permissions_detail || []).map((pd: any) => {
      if (pd.permission === permissionId) {
        return { ...pd, scope: newScope };
      }
      return pd;
    });

    const updatedProfile = { ...editingProfile, permissions_detail: updatedPermissions };
    setEditingProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? updatedProfile : p));
  };

  const handleCreateProfile = async (name: string, description: string) => {
    if (!name.trim()) return;
    
    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/profiles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          permissions: []
        })
      });
      if (res.ok) {
        const newProf = await res.json();
        alert("Perfil creado con éxito.");
        checkBackendAPI();
        setEditingProfile(newProf);
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "No se pudo crear el perfil."}`);
      }
    } catch (err) {
      alert("Error de conexión al crear el perfil.");
    }
  };

  const handleDeleteProfile = async (profileId: number) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    if (profile.name === "Administrador del Sistema") {
      alert("El perfil 'Administrador del Sistema' es del sistema y no se puede eliminar.");
      return;
    }

    if (!confirm(`¿Está seguro de que desea eliminar el perfil '${profile.name}'?`)) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/profiles/${profileId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("Perfil eliminado con éxito.");
        checkBackendAPI();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "No se pudo eliminar el perfil."}`);
      }
    } catch (err) {
      alert("Error de conexión al eliminar el perfil.");
    }
  };

  const handleSaveProfilePermissions = async () => {
    if (!editingProfile) return;

    const permissionsPayload = (editingProfile.permissions_detail || []).map((pd: any) => ({
      permission_id: pd.permission,
      scope: pd.scope
    }));

    const token = localStorage.getItem("access_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/profiles/${editingProfile.id}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingProfile.name,
          description: editingProfile.description,
          permissions: permissionsPayload
        })
      });
      if (res.ok) {
        alert("Cambios guardados con éxito en el servidor.");
        checkBackendAPI();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error || "No se pudieron guardar los cambios."}`);
      }
    } catch (err) {
      alert("Error de conexión al guardar cambios.");
    }
  };

  const handleCreateUserSubmit = async (userData: any): Promise<boolean> => {
    const token = localStorage.getItem("access_token");
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/users/admin/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        alert("Usuario creado con éxito.");
        checkBackendAPI();
        setShowCreateUserForm(false);
        setActiveTab("profiles");
        return true;
      } else {
        const errData = await res.json();
        alert(`Error al registrar usuario: ${JSON.stringify(errData)}`);
        return false;
      }
    } catch (err) {
      alert("Error de conexión al crear el usuario.");
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/auth/login");
  };

  return (
    <>
    {/* BIFURCACIÓN: Landing Pública vs Dashboard Interno */}
    {isAuthenticated === null ? (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-[#6b7280]">Cargando...</p>
        </div>
      </div>
    ) : isAuthenticated === false ? (
      <PublicLanding />
    ) : (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* HEADER DE LA APLICACIÓN */}
      <Header
        currentUser={currentUser}
        isPremium={isPremium}
        apiOnline={apiOnline}
        loadingAPI={loadingAPI}
        checkBackendAPI={checkBackendAPI}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* SIDEBAR OVERLAY */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        isPremium={isPremium}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* DASHBOARD PRINCIPAL */}
      <div className="flex-1 flex">
        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 sm:p-8 flex flex-col overflow-y-auto max-h-[calc(100vh-64px)] w-full">
          {/* TAB 1: CATÁLOGO DE PRODUCTOS (E-COMMERCE) */}
          {activeTab === "catalog" && (
            <CatalogView
              products={products}
              addToCart={addToCart}
              cart={cart}
              updateCartQty={updateCartQty}
              removeFromCart={removeFromCart}
              handleCheckout={handleCheckout}
            />
          )}

          {/* TAB 2: TUTOR VISUAL IA (CHAT RAG) */}
          {activeTab === "tutor" && (
            <TutorVisualChat
              products={products}
              addToCart={addToCart}
              isPremium={isPremium}
              apiBaseUrl={API_BASE_URL}
              isAdmin={isAdmin}
              googleApiKeyConfigured={currentUser?.google_api_key_configured ?? false}
            />
          )}

          {/* TAB 2.5: GESTIÓN DE INVENTARIO */}
          {activeTab === "inventory" && (
            <InventoryPanel
              products={products}
              apiBaseUrl={API_BASE_URL}
              currentUser={currentUser}
              refreshCatalog={checkBackendAPI}
            />
          )}

          {/* TAB 3: GESTIÓN DE PERFILES */}
          {activeTab === "profiles" && (
            <ProfileSecurity
              users={users}
              profiles={profiles}
              permissions={permissions}
              selectedAdminUser={selectedAdminUser}
              setSelectedAdminUser={setSelectedAdminUser}
              profileExpirations={profileExpirations}
              setProfileExpirations={setProfileExpirations}
              editingProfile={editingProfile}
              setEditingProfile={setEditingProfile}
              toggleUserProfile={toggleUserProfile}
              handleTogglePermissionInProfile={handleTogglePermissionInProfile}
              handleUpdatePermissionScope={handleUpdatePermissionScope}
              handleCreateProfile={handleCreateProfile}
              handleDeleteProfile={handleDeleteProfile}
              handleSaveProfilePermissions={handleSaveProfilePermissions}
              handleCreateUserSubmit={handleCreateUserSubmit}
              showCreateUserForm={showCreateUserForm}
              setShowCreateUserForm={setShowCreateUserForm}
            />
          )}

          {/* TAB 3.5: ALTA DE USUARIO VISTA COMPLETA */}
          {activeTab === "create-user" && (
            <div className="flex-grow flex flex-col gap-6 text-left max-w-2xl mx-auto w-full">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#1a1a2e]">
                  <Users className="text-[#E8612D]" />
                  <span>Alta de Usuario</span>
                </h2>
                <p className="text-xs text-[#6b7280]">Creación de usuarios internos del sistema y asignación de perfiles iniciales con expiración.</p>
              </div>

              <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 flex flex-col gap-6 shadow-sm">
                <UserCreateForm
                  profiles={profiles}
                  onSubmit={handleCreateUserSubmit}
                  onCancel={() => setActiveTab("profiles")}
                />
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "audits" && (
            <AuditLogTable auditLogs={auditLogs} />
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7eb] py-4 px-6 flex items-center justify-between text-xs text-[#9ca3af] bg-white mt-auto">
        <p>© 2026 CraftIAr. Todos los derechos reservados.</p>
        <p className="font-mono">Next.js 15.1 + Django REST Framework + pgvector</p>
      </footer>
    </div>
    )}
    </>
  );
}
