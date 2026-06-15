/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, CheckCircle2, AlertCircle, Info, X, Bot, Building2 } from "lucide-react";


// Componentes Modularizados
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import CatalogView from "@/components/catalog/CatalogView";
import TutorVisualChat from "@/components/tutor/TutorVisualChat";
import { ChatProvider, useChat } from "@/components/tutor/ChatContext";
import ProfileSecurity from "@/components/admin/ProfileSecurity";
import AuditLogTable from "@/components/admin/AuditLogTable";
import UserCreateForm from "@/components/admin/UserCreateForm";
import InventoryPanel from "@/components/catalog/InventoryPanel";
import SalesPanel from "@/components/admin/SalesPanel";
import GestionPanel from "@/components/admin/GestionPanel";
import PublicLanding from "@/components/public/PublicLanding";
import { startSessionWatch, stopSessionWatch } from "@/lib/session";

// URL Base de la API de Django
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");

const CLIENT_PERMS = [
  "catalogo.ver_catalogo", "catalogo.busqueda_semantica", "pedidos.ver",
  "carrito.gestionar", "carrito.checkout", "tutor.acceder", "tutor.ver_historial",
  "suscripciones.ver", "suscripciones.suscribirse",
];

export default function Dashboard() {
  return (
    <ChatProvider>
      <DashboardInner />
    </ChatProvider>
  );
}

function DashboardInner() {
  const router = useRouter();
  const { hasActiveSession, clearSession, isWidgetOpen, setIsWidgetOpen } = useChat();

  // ----------------------------------------------------
  // ESTADOS PRINCIPALES
  // ----------------------------------------------------
  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean, 
    title: string, 
    message: string, 
    type: "success"|"error"|"info"|"confirm"|"custom_confirm",
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string
  }>({isOpen: false, title: "", message: "", type: "info"});

  // Sesión única: abrir el stream SSE para cerrar la sesión en tiempo real si
  // se inicia sesión con la misma cuenta en otro dispositivo.
  useEffect(() => {
    startSessionWatch();
    return () => stopSessionWatch();
  }, []);

  useEffect(() => {
    // Override window.alert para usar el modal global menos intrusivo (y sin fondo borroso fuerte)
    window.alert = (msg: string) => {
       let type: "success" | "error" | "info" = "info";
       let title = "Notificación";
       const lowerMsg = msg.toLowerCase();
       if (lowerMsg.includes("error")) { type = "error"; title = "Error"; }
       else if (lowerMsg.includes("éxito") || lowerMsg.includes("exito")) { type = "success"; title = "¡Éxito!"; }
       setGlobalModal({ isOpen: true, title, message: msg, type });
    };
  }, []);
  const [activeTab, setActiveTab] = useState<"catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory" | "sales" | "g_dashboard" | "g_reportes" | "g_stock" | "g_banners" | "g_promos" | "g_planes" | "g_subs">("catalog");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const handleTabChange = (newTab: "catalog" | "tutor" | "profiles" | "audits" | "create-user" | "inventory" | "sales" | "g_dashboard" | "g_reportes" | "g_stock" | "g_banners" | "g_promos" | "g_planes" | "g_subs") => {
    if (newTab === activeTab) return;
    
    // Si estamos interactuando con el chat y cambiamos de contexto
    if ((activeTab === "tutor" || newTab === "tutor") && hasActiveSession()) {
      const isGoingToFull = newTab === "tutor";
      setGlobalModal({
        isOpen: true,
        title: "Sesión en Curso",
        message: `Tienes una conversación de IA activa. ¿Deseas ${isGoingToFull ? "mantenerla o iniciar una nueva" : "cerrar la sesión o seguir charlando en la otra pantalla"}?`,
        type: "custom_confirm",
        confirmText: isGoingToFull ? "Mantener Sesión" : "Seguir en la otra pantalla",
        cancelText: isGoingToFull ? "Iniciar Nueva" : "Cerrar Sesión",
        onConfirm: () => {
          // MANTENER / SEGUIR EN SEGUNDO PLANO
          setActiveTab(newTab);
          if (isGoingToFull) setIsWidgetOpen(false); 
          else setIsWidgetOpen(true);
          setGlobalModal(prev => ({...prev, isOpen: false}));
        },
        onCancel: () => {
          // NUEVA SESION / CERRAR SESION
          clearSession();
          setActiveTab(newTab);
          setIsWidgetOpen(false);
        }
      });
      return;
    }

    setActiveTab(newTab);
    if (newTab === "tutor") setIsWidgetOpen(false);
  };
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
  const [heroBannerData, setHeroBannerData] = useState<any>(undefined);

  // ----------------------------------------------------
  // CONEXIÓN CON EL BACKEND
  // ----------------------------------------------------
  const checkBackendAPI = async () => {
    setLoadingAPI(true);
    const token = localStorage.getItem("access_token");

    if (!token) {
      // Sin token: cargar catálogo y banner antes de mostrar la landing
      try {
        const [prodResult, bannerResult] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/catalog/products/`),
          fetch(`${API_BASE_URL}/catalog/banners/public/?slot=hero`),
        ]);
        if (prodResult.status === "fulfilled" && prodResult.value.ok) {
          const prodData = await prodResult.value.json();
          setProducts(Array.isArray(prodData) ? prodData : (prodData.results ?? []));
        }
        if (bannerResult.status === "fulfilled" && bannerResult.value.ok) {
          const d = await bannerResult.value.json();
          const list = Array.isArray(d) ? d : (d.results || []);
          setHeroBannerData(list[0] || null);
        } else {
          setHeroBannerData(null);
        }
      } catch (err) {
        console.error("Error loading public catalog:", err);
        setHeroBannerData(null);
      }
      setIsAuthenticated(false);
      setLoadingAPI(false);
      return;
    }

    const headers = { "Authorization": `Bearer ${token}` };

    try {
      // 1. Verificar token y cargar perfil del usuario
      const profUserRes = await fetch(`${API_BASE_URL}/users/auth/profile/`, { headers });
      if (!profUserRes.ok) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Token inválido: cargar catálogo y banner antes de mostrar la landing pública
        try {
          const [prodResult, bannerResult] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/catalog/products/`),
            fetch(`${API_BASE_URL}/catalog/banners/public/?slot=hero`),
          ]);
          if (prodResult.status === "fulfilled" && prodResult.value.ok) {
            const prodData = await prodResult.value.json();
            setProducts(Array.isArray(prodData) ? prodData : (prodData.results ?? []));
          }
          if (bannerResult.status === "fulfilled" && bannerResult.value.ok) {
            const d = await bannerResult.value.json();
            const list = Array.isArray(d) ? d : (d.results || []);
            setHeroBannerData(list[0] || null);
          } else {
            setHeroBannerData(null);
          }
        } catch {}
        setIsAuthenticated(false);
        return;
      }

      const userData = await profUserRes.json();
      setCurrentUser(userData);
      setApiOnline(true);

      // Determinar si el usuario necesita datos de gestión interna
      const userIsDashboard = userData.is_superuser || (
        userData.active_permissions && typeof userData.active_permissions === "object" &&
        Object.keys(userData.active_permissions).some(
          (code) => code !== "all" && !CLIENT_PERMS.includes(code)
        )
      );

      if (userIsDashboard) {
        // Dashboard: cargar todo en paralelo
        const [prodResult, profResult, permResult, userResult, auditResult] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/catalog/products/`),
          fetch(`${API_BASE_URL}/users/admin/profiles/`, { headers }),
          fetch(`${API_BASE_URL}/users/admin/permissions/`, { headers }),
          fetch(`${API_BASE_URL}/users/admin/users/`, { headers }),
          fetch(`${API_BASE_URL}/users/admin/audit-logs/`, { headers }),
        ]);

        if (prodResult.status === "fulfilled" && prodResult.value.ok) {
          const prodData = await prodResult.value.json();
          setProducts(Array.isArray(prodData) ? prodData : (prodData.results ?? []));
        }
        if (profResult.status === "fulfilled" && profResult.value.ok) {
          const profData = await profResult.value.json();
          setProfiles(profData);
          if (profData.length > 0) setEditingProfile(profData[0]);
        }
        if (permResult.status === "fulfilled" && permResult.value.ok) {
          setPermissions(await permResult.value.json());
        }
        if (userResult.status === "fulfilled" && userResult.value.ok) {
          const usersData = await userResult.value.json();
          setUsers(usersData);
          if (usersData.length > 0) setSelectedAdminUser(usersData[0]);
        }
        if (auditResult.status === "fulfilled" && auditResult.value.ok) {
          setAuditLogs(await auditResult.value.json());
        }
      } else {
        // Cliente: cargar catálogo y banner en paralelo
        try {
          const [prodResult, bannerResult] = await Promise.allSettled([
            fetch(`${API_BASE_URL}/catalog/products/`),
            fetch(`${API_BASE_URL}/catalog/banners/public/?slot=hero`),
          ]);
          if (prodResult.status === "fulfilled" && prodResult.value.ok) {
            const prodData = await prodResult.value.json();
            setProducts(Array.isArray(prodData) ? prodData : (prodData.results ?? []));
          }
          if (bannerResult.status === "fulfilled" && bannerResult.value.ok) {
            const d = await bannerResult.value.json();
            const list = Array.isArray(d) ? d : (d.results || []);
            setHeroBannerData(list[0] || null);
          } else {
            setHeroBannerData(null);
          }
        } catch {}
      }

      // Solo mostrar la página cuando todos los datos están listos
      setIsAuthenticated(true);
    } catch (err) {
      console.error("Error connecting to backend API:", err);
      setApiOnline(false);
      setIsAuthenticated(false);
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

  // Entra al Dashboard Interno solo si es superuser o tiene al menos un permiso
  // que NO es de cliente (es decir, algún permiso de gestión interna/staff).
  // Quien solo tiene permisos de cliente ve la tienda (PublicLanding), sin sidebar interno.
  const isDashboardUser = currentUser && (
    currentUser.is_superuser ||
    (currentUser.active_permissions && typeof currentUser.active_permissions === "object" &&
      Object.keys(currentUser.active_permissions).some((code) => code !== "all" && !CLIENT_PERMS.includes(code)))
  );

  const canViewCatalog = currentUser?.is_superuser || (
    currentUser?.active_permissions &&
    typeof currentUser.active_permissions === "object" &&
    "catalogo.ver_catalogo" in currentUser.active_permissions
  );

  // Redirigir la pestaña por defecto si no tiene permisos
  useEffect(() => {
    if (currentUser && activeTab === "catalog" && !canViewCatalog) {
      setActiveTab("tutor");
    }
  }, [currentUser, canViewCatalog, activeTab]);

  // RN-02: al autenticarse, el carrito de la cuenta (BD) prevalece y
  // reemplaza cualquier carrito anónimo armado localmente.
  useEffect(() => {
    if (currentUser) loadServerCart();
  }, [currentUser?.id]);

  // ----------------------------------------------------
  // LÓGICA DEL CARRITO (Persistente en BD para usuarios autenticados — RN-01)
  // El carrito anónimo vive solo en memoria del navegador y se descarta al
  // iniciar sesión: el carrito de la cuenta prevalece (RN-02).
  // ----------------------------------------------------
  const [cartMeta, setCartMeta] = useState<{
    subtotal: number;
    coupon_code: string | null;
    discount_amount: number;
    total: number;
  }>({ subtotal: 0, coupon_code: null, discount_amount: 0, total: 0 });

  const authHeaders = () => {
    const token = localStorage.getItem("access_token");
    return token ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` } : null;
  };

  // Mapear la respuesta del backend (CartSerializer) al estado local del carrito
  const applyServerCart = (data: any) => {
    const items = (data.items || []).map((it: any) => ({
      product: {
        id: it.product_id,
        sku: it.sku,
        name: it.name,
        price: parseFloat(it.price),
        stock: it.stock,
        weight_kg: parseFloat(it.weight_kg),
        image_url: it.image_url,
        description: "",
        category_name: "",
      },
      quantity: it.quantity,
    }));
    setCart(items);
    setCartMeta({
      subtotal: data.subtotal ?? 0,
      coupon_code: data.coupon_code ?? null,
      discount_amount: data.discount_amount ?? 0,
      total: data.total ?? 0,
    });
    // RN-04: informar productos quitados por estar desactivados/eliminados
    if (data.removed_items && data.removed_items.length > 0) {
      alert(`Se quitaron del carrito productos que ya no están disponibles: ${data.removed_items.join(", ")}.`);
    }
    // RN-03: informar ajustes de cantidad por límite de stock
    if (data.adjusted) {
      alert(data.adjusted);
    }
  };

  const loadServerCart = async () => {
    const headers = authHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/cart/`, { headers });
      if (res.ok) {
        applyServerCart(await res.json());
      }
    } catch {
      /* sin conexión: se mantiene el estado local */
    }
  };

  const addToCart = async (product: any, quantity: number = 1) => {
    const headers = authHeaders();
    if (headers && currentUser) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/cart/items/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ product_id: product.id, quantity }),
        });
        const data = await res.json();
        if (res.ok) applyServerCart(data);
        else alert(`Error: ${data.error || "No se pudo agregar al carrito."}`);
      } catch {
        alert("Error de conexión al agregar al carrito.");
      }
      return;
    }
    // Visitante anónimo: carrito local temporal
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

  const updateCartQty = async (productId: number, newQty: number) => {
    const headers = authHeaders();
    if (headers && currentUser) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/cart/items/${productId}/`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ quantity: newQty }),
        });
        const data = await res.json();
        if (res.ok) applyServerCart(data);
        else alert(`Error: ${data.error || "No se pudo actualizar la cantidad."}`);
      } catch {
        alert("Error de conexión al actualizar el carrito.");
      }
      return;
    }
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

  const removeFromCart = async (productId: number) => {
    const headers = authHeaders();
    if (headers && currentUser) {
      try {
        const res = await fetch(`${API_BASE_URL}/orders/cart/items/${productId}/`, {
          method: "DELETE",
          headers,
        });
        const data = await res.json();
        if (res.ok) applyServerCart(data);
      } catch {
        alert("Error de conexión al actualizar el carrito.");
      }
      return;
    }
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartMeta({ subtotal: 0, coupon_code: null, discount_amount: 0, total: 0 });
  };

  // RN-06 a RN-10: aplicar/quitar cupón de descuento
  const applyCoupon = async (code: string): Promise<string | null> => {
    const headers = authHeaders();
    if (!headers || !currentUser) return "Inicia sesión para aplicar cupones.";
    try {
      const res = await fetch(`${API_BASE_URL}/orders/cart/coupon/`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        applyServerCart(data);
        return null;
      }
      return data.error || "No se pudo aplicar el cupón.";
    } catch {
      return "Error de conexión al aplicar el cupón.";
    }
  };

  const removeCoupon = async () => {
    const headers = authHeaders();
    if (!headers || !currentUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/cart/coupon/`, {
        method: "DELETE",
        headers,
      });
      const data = await res.json();
      if (res.ok) applyServerCart(data);
    } catch {
      alert("Error de conexión al quitar el cupón.");
    }
  };

  // Dirige a la página dedicada de checkout (estilo Mercado Libre)
  const openCheckout = () => {
    if (cart.length === 0) return;
    router.push("/checkout");
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

  const requestDeleteProfile = (profileId: number) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    if (profile.name === "Administrador del Sistema") {
      alert("El perfil 'Administrador del Sistema' es del sistema y no se puede eliminar.");
      return;
    }

    setGlobalModal({
      isOpen: true,
      title: "Confirmar Eliminación",
      message: `¿Está seguro de que desea eliminar el perfil '${profile.name}'? Esta acción no se puede deshacer.`,
      type: "confirm",
      onConfirm: () => executeDeleteProfile(profileId)
    });
  };

  const executeDeleteProfile = async (profileId: number) => {
    setGlobalModal(prev => ({ ...prev, isOpen: false }));
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] gap-5">
        <div className="flex items-center gap-2">
          <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
            <Building2 size={22} />
          </div>
          <span className="text-xl font-bold tracking-tight select-none text-[#1a1a2e]">
            Craft<span className="text-[#E8612D]">IAr</span>
          </span>
        </div>
        <div className="w-7 h-7 border-2 border-[#E8612D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : isAuthenticated === false || !isDashboardUser ? (
      <PublicLanding
        currentUser={currentUser}
        onLogout={handleLogout}
        cart={cart}
        cartMeta={cartMeta}
        addToCart={addToCart}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        handleCheckout={openCheckout}
        applyCoupon={applyCoupon}
        removeCoupon={removeCoupon}
        isPremium={isPremium}
        apiBaseUrl={API_BASE_URL}
        initialHeroBanner={heroBannerData}
      />
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
        onOpenTutor={() => handleTabChange("tutor")}
      />

      {/* SIDEBAR OVERLAY */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
        isPremium={isPremium}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        currentUser={currentUser}
      />

      {/* DASHBOARD PRINCIPAL */}
      <div className="flex-1 flex">
        {/* CONTENIDO PRINCIPAL */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 flex flex-col max-h-[calc(100vh-64px)] w-full ${activeTab === 'tutor' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* TAB 1: CATÁLOGO DE PRODUCTOS (E-COMMERCE) */}
          {activeTab === "catalog" && (
            <CatalogView
              products={products}
              addToCart={addToCart}
              cart={cart}
              cartMeta={cartMeta}
              updateCartQty={updateCartQty}
              removeFromCart={removeFromCart}
              handleCheckout={openCheckout}
              applyCoupon={applyCoupon}
              removeCoupon={removeCoupon}
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

          {/* TAB 2.6: GESTIÓN DE VENTAS */}
          {activeTab === "sales" && (
            <SalesPanel
              apiBaseUrl={API_BASE_URL}
              currentUser={currentUser}
            />
          )}

          {/* MÓDULOS DE GESTIÓN INTERNA (cada uno su propia entrada en el sidebar) */}
          {activeTab.startsWith("g_") && (
            <GestionPanel
              apiBaseUrl={API_BASE_URL}
              section={({
                g_dashboard: "dashboard", g_reportes: "reportes", g_stock: "stock",
                g_banners: "banners", g_promos: "promociones", g_planes: "planes", g_subs: "suscripciones",
              } as const)[activeTab as "g_dashboard" | "g_reportes" | "g_stock" | "g_banners" | "g_promos" | "g_planes" | "g_subs"]}
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
              handleDeleteProfile={requestDeleteProfile}
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

              <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 sm:p-8 flex flex-col gap-6 shadow-sm">
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

          {/* GLOBAL ALERT MODAL */}
          {globalModal.isOpen && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4 animate-[fadeIn_0.2s_ease]">
              <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-sm shadow-2xl relative text-center flex flex-col items-center">
                {(globalModal.type === "confirm" || globalModal.type === "custom_confirm") && (
                  <div className="bg-orange-50 text-[#E8612D] p-4 rounded-full mb-4">
                    <AlertCircle size={32} />
                  </div>
                )}
                {globalModal.type === "success" && (
                  <div className="bg-green-50 text-green-600 p-4 rounded-full mb-4">
                    <CheckCircle2 size={32} />
                  </div>
                )}
                {globalModal.type === "error" && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
                    <AlertCircle size={32} />
                  </div>
                )}
                {globalModal.type === "info" && (
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
                    <Info size={32} />
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">{globalModal.title}</h3>
                <p className="text-sm text-gray-500 mb-8">{globalModal.message}</p>
                
                {(globalModal.type === "confirm" || globalModal.type === "custom_confirm") ? (
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => {
                        if (globalModal.onCancel) globalModal.onCancel();
                        setGlobalModal({...globalModal, isOpen: false});
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all"
                    >
                      {globalModal.cancelText || "Cancelar"}
                    </button>
                    <button
                      onClick={globalModal.onConfirm}
                      className="flex-1 px-4 py-3 bg-[#E8612D] hover:bg-[#d4551f] text-white rounded-xl font-bold transition-all shadow-md"
                    >
                      {globalModal.confirmText || "Confirmar"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setGlobalModal({...globalModal, isOpen: false})}
                    className="w-full px-4 py-3 bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white rounded-xl font-bold transition-all shadow-md"
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FLOATING WIDGET (TutorIA) */}
          {isPremium && isWidgetOpen && activeTab !== "tutor" && (
            <div className="fixed bottom-4 right-4 w-[350px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-100px)] z-50 flex flex-col shadow-2xl rounded-xl overflow-hidden border border-[#e5e7eb] bg-white animate-[fadeIn_0.3s_ease-out]">
              {/* Header del Chat Flotante */}
              <div className="flex items-center justify-between p-3 border-b border-[#E8612D]/20 bg-[#E8612D] text-white shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                  <Bot size={20} />
                  <span className="text-sm">Tutor IA</span>
                </div>
                <button onClick={() => setIsWidgetOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-white flex flex-col">
                <TutorVisualChat
                  products={products}
                  addToCart={addToCart}
                  isPremium={isPremium}
                  apiBaseUrl={API_BASE_URL}
                  isAdmin={isAdmin}
                  googleApiKeyConfigured={currentUser?.google_api_key_configured ?? false}
                  layoutMode="widget"
                />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#e5e7eb] py-4 px-6 text-xs text-[#9ca3af] bg-white mt-auto text-center">
        <p>© {new Date().getFullYear()} Craftiar. Todos los derechos reservados.</p>
      </footer>
    </div>
    )}
    </>
  );
}
