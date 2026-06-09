"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  ShoppingCart, 
  Bot, 
  ShieldCheck, 
  User as UserIcon, 
  Trash2, 
  Plus, 
  Minus, 
  Search, 
  Sparkles, 
  CheckSquare, 
  Users, 
  Calendar, 
  Clock, 
  ArrowRight, 
  LogOut,
  ChevronRight,
  Shield,
  FileCode,
  CheckCircle,
  HelpCircle,
  Lock,
  Loader
} from "lucide-react";

// URL Base de la API de Django
const API_BASE_URL = "http://localhost:8000/api";

// ----------------------------------------------------
// DATOS MOCK DE FALLBACK (Para cuando la API de Django esté apagada)
// ----------------------------------------------------
const MOCK_PRODUCTS = [
  { id: 1, sku: "Cem-001", name: "Cemento Portland Loma Negra 50kg", description: "Cemento de alta resistencia para estructuras de hormigón y albañilería general.", price: 12500.00, stock: 150, weight_kg: 50.0, category_name: "Cementos y Cales", image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop" },
  { id: 2, sku: "Cem-002", name: "Cemento Portland Avellaneda 50kg", description: "Cemento de fraguado rápido y alta resistencia inicial, óptimo para losas.", price: 12300.00, stock: 100, weight_kg: 50.0, category_name: "Cementos y Cales", image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop" },
  { id: 3, sku: "Cem-003", name: "Cal Hidratada Loma Negra 25kg", description: "Cal hidratada aérea de alta plasticidad para mezcla de revoques y contrapisos.", price: 5400.00, stock: 200, weight_kg: 25.0, category_name: "Cementos y Cales", image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=400&auto=format&fit=crop" },
  
  { id: 4, sku: "Lad-001", name: "Ladrillo Hueco 12x18x33 (Unidad)", description: "Ladrillo cerámico hueco de 6 tubos para muros portantes y divisiones.", price: 480.00, stock: 2500, weight_kg: 4.2, category_name: "Ladrillos y Bloques", image_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=400&auto=format&fit=crop" },
  { id: 5, sku: "Lad-002", name: "Ladrillo Hueco 18x18x33 (Unidad)", description: "Ladrillo hueco de 9 tubos ideal para paredes exteriores y cerramientos térmicos.", price: 650.00, stock: 1800, weight_kg: 5.8, category_name: "Ladrillos y Bloques", image_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=400&auto=format&fit=crop" },
  { id: 6, sku: "Lad-003", name: "Ladrillo Común de Campo (1000u)", description: "Ladrillo macizo tradicional para hornos, paredes a la vista y cimientos.", price: 145000.00, stock: 15, weight_kg: 2000.0, category_name: "Ladrillos y Bloques", image_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=400&auto=format&fit=crop" },
  { id: 7, sku: "Lad-004", name: "Bloque de Hormigón 19x19x39 (Unidad)", description: "Bloque de hormigón prensado para construcción modular de alta velocidad.", price: 980.00, stock: 1200, weight_kg: 14.0, category_name: "Ladrillos y Bloques", image_url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?q=80&w=400&auto=format&fit=crop" },

  { id: 8, sku: "Hie-001", name: "Hierro Nervado Aluar 8mm (Barra 12m)", description: "Barra de acero nervado grado 420 para armaduras de hormigón armado.", price: 10800.00, stock: 80, weight_kg: 4.74, category_name: "Hierros y Mallas", image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=400&auto=format&fit=crop" },
  { id: 9, sku: "Hie-002", name: "Hierro Nervado Aluar 10mm (Barra 12m)", description: "Barra de acero nervado grado 420 utilizada en vigas y columnas principales.", price: 16800.00, stock: 60, weight_kg: 7.4, category_name: "Hierros y Mallas", image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=400&auto=format&fit=crop" },
  
  { id: 10, sku: "Adh-001", name: "Pegamento Impermeable Weber Col 25kg", description: "Mezcla adhesiva impermeable para la colocación de cerámicas en interiores y exteriores.", price: 8700.00, stock: 90, weight_kg: 25.0, category_name: "Adhesivos y Pastinas", image_url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=400&auto=format&fit=crop" },
  { id: 11, sku: "Yes-001", name: "Placa de Yeso Durlock Estándar 12.5mm", description: "Placa de yeso estándar de 1.20 x 2.40 metros para tabiques y cielorrasos.", price: 14800.00, stock: 85, weight_kg: 21.0, category_name: "Yesos y Placas de Yeso", image_url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=400&auto=format&fit=crop" },
  { id: 12, sku: "Pin-001", name: "Pintura Látex Interior Alba Mate 20L", description: "Pintura al agua de alto poder cubritivo y lavable para ambientes interiores.", price: 89000.00, stock: 25, weight_kg: 28.0, category_name: "Pinturas e Impermeabilizantes", image_url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?q=80&w=400&auto=format&fit=crop" },
];

const MOCK_PERMISSIONS = [
  { id: 1, code: "users:ver:todos", module: "users", description: "Ver listado de todos los usuarios" },
  { id: 2, code: "users:modificar_perfiles", module: "users", description: "Asignar o revocar perfiles a usuarios" },
  { id: 3, code: "profiles:gestionar", module: "users", description: "Configurar permisos de perfiles dinámicos" },
  { id: 4, code: "audit:ver", module: "users", description: "Ver logs de auditoría de seguridad" },
  { id: 5, code: "catalog:crear", module: "catalog", description: "Crear y modificar productos del catálogo" },
  { id: 6, code: "orders:ver_todos", module: "orders", description: "Ver pedidos de todos los usuarios" },
  { id: 7, code: "orders:gestionar_estado", module: "orders", description: "Actualizar el estado de los pedidos" },
  { id: 8, code: "tutor:acceso", module: "tutor", description: "Acceso para consultar al Tutor Visual IA" },
  { id: 9, code: "banners:ver:todos", module: "banners", description: "Ver banners publicitarios" },
  { id: 10, code: "banners:crear:todos", module: "banners", description: "Crear nuevos banners publicitarios" },
  { id: 11, code: "banners:eliminar:todos", module: "banners", description: "Eliminar banners del home" },
  { id: 12, code: "promociones:gestionar", module: "promociones", description: "Crear cupones y descuentos" },
];

const MOCK_PROFILES = [
  {
    id: 1,
    name: "Comprar en la tienda",
    description: "Perfil base para compras ordinarias en la tienda.",
    permissions_detail: []
  },
  {
    id: 2,
    name: "Tutor Visual IA",
    description: "Habilita el uso del Tutor Visual con Inteligencia Artificial.",
    permissions_detail: [{ permission: 8, permission_code: "tutor:acceso", scope: "propios", module: "tutor" }]
  },
  {
    id: 3,
    name: "Pasante de Marketing",
    description: "Gestión de banners y promociones.",
    permissions_detail: [
      { permission: 9, permission_code: "banners:ver:todos", scope: "todos", module: "banners" },
      { permission: 10, permission_code: "banners:crear:todos", scope: "todos", module: "banners" }
    ]
  },
  {
    id: 4,
    name: "Vendedor/Proveedor",
    description: "Administración del catálogo y procesamiento de pedidos.",
    permissions_detail: [
      { permission: 5, permission_code: "catalog:crear", scope: "propios", module: "catalog" },
      { permission: 6, permission_code: "orders:ver_todos", scope: "todos", module: "orders" },
      { permission: 7, permission_code: "orders:gestionar_estado", scope: "todos", module: "orders" }
    ]
  },
  {
    id: 5,
    name: "Administrador del Sistema",
    description: "Acceso total a la configuración y auditoría.",
    permissions_detail: [
      { permission: 1, permission_code: "users:ver:todos", scope: "todos", module: "users" },
      { permission: 2, permission_code: "users:modificar_perfiles", scope: "todos", module: "users" },
      { permission: 3, permission_code: "profiles:gestionar", scope: "todos", module: "users" },
      { permission: 4, permission_code: "audit:ver", scope: "todos", module: "users" },
      { permission: 5, permission_code: "catalog:crear", scope: "todos", module: "catalog" },
      { permission: 6, permission_code: "orders:ver_todos", scope: "todos", module: "orders" },
      { permission: 7, permission_code: "orders:gestionar_estado", scope: "todos", module: "orders" },
      { permission: 8, permission_code: "tutor:acceso", scope: "todos", module: "tutor" },
      { permission: 9, permission_code: "banners:ver:todos", scope: "todos", module: "banners" },
      { permission: 10, permission_code: "banners:crear:todos", scope: "todos", module: "banners" },
      { permission: 11, permission_code: "banners:eliminar:todos", scope: "todos", module: "banners" },
      { permission: 12, permission_code: "promociones:gestionar", scope: "todos", module: "promociones" }
    ]
  }
];

const MOCK_USERS = [
  { 
    id: 1, 
    username: "admin", 
    email: "admin@construccion.com", 
    first_name: "Admin", 
    last_name: "General", 
    assignments: [
      { id: 101, profile: 5, profile_name: "Administrador del Sistema", is_active: true, expires_at: null, has_expired: false }
    ],
    active_permissions: { "all": "todos" } 
  },
  { 
    id: 2, 
    username: "gonzalo", 
    email: "gonzalo.marketing@tienda.com", 
    first_name: "Gonzalo", 
    last_name: "Pasante", 
    assignments: [
      { id: 102, profile: 3, profile_name: "Pasante de Marketing", is_active: true, expires_at: "2026-07-31T23:59:59Z", has_expired: false },
      { id: 103, profile: 1, profile_name: "Comprar en la tienda", is_active: true, expires_at: null, has_expired: false }
    ],
    active_permissions: { "banners:ver:todos": "todos", "banners:crear:todos": "todos" } 
  },
  { 
    id: 3, 
    username: "maria_cliente", 
    email: "maria.flores@gmail.com", 
    first_name: "María", 
    last_name: "Flores", 
    assignments: [
      { id: 104, profile: 1, profile_name: "Comprar en la tienda", is_active: true, expires_at: null, has_expired: false }
    ],
    active_permissions: {} 
  }
];

const MOCK_AUDITS = [
  { id: 1, timestamp: "2026-06-08T15:20:00Z", username: "admin", profile_name: "Administrador del Sistema", action: "assign", performed_by_name: "System", notes: "Creado automáticamente como superusuario inicial." },
  { id: 2, timestamp: "2026-06-08T15:25:00Z", username: "gonzalo", profile_name: "Pasante de Marketing", action: "assign", performed_by_name: "admin", notes: "Perfil asignado manualmente con vencimiento al 31/07/2026." },
  { id: 3, timestamp: "2026-06-08T15:25:10Z", username: "gonzalo", profile_name: "Comprar en la tienda", action: "assign", performed_by_name: "System", notes: "Perfil base asignado automáticamente al registrarse." }
];

export default function Dashboard() {
  // ----------------------------------------------------
  // ESTADOS PRINCIPALES
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<"catalog" | "tutor" | "roles" | "audits">("catalog");
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [permissions] = useState(MOCK_PERMISSIONS);
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDITS);
  
  // Usuario Logueado en el Frontend
  const [currentUser, setCurrentUser] = useState<any>(MOCK_USERS[2]); // Empezar como María (Cliente Estándar)
  const [isPremium, setIsPremium] = useState(false);
  
  // Búsqueda y Filtros de Catálogo
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Chat del Tutor Visual
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "¡Hola! Soy tu Tutor Visual de Construcción. Escríbeme qué proyecto tienes en mente (ej. 'Quiero levantar una pared de 4x3 metros' o 'Voy a colocar porcelanato en un cuarto de 5x5m') y te daré una guía de instalación paso a paso, calculando los materiales necesarios que podrás agregar a tu carrito de compras.",
      materials: []
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Estados de ABM Roles en el Panel de Administrador
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(MOCK_USERS[1]); // Seleccionar Gonzalo por defecto
  const [profileExpirations, setProfileExpirations] = useState<{ [key: number]: string }>({
    3: "2026-07-31" // Vencimiento inicial para Marketing
  });

  // Estado para la Edición de Permisos de Perfiles Dinámicos
  const [editingProfile, setEditingProfile] = useState<any>(MOCK_PROFILES[2]); // Pasante de Marketing por defecto

  // Estado de conexión a la API Django
  const [apiOnline, setApiOnline] = useState(false);
  const [loadingAPI, setLoadingAPI] = useState(false);

  // Categorías Únicas
  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category_name)))];

  // ----------------------------------------------------
  // CONEXIÓN CON EL BACKEND (O FALLBACK AUTOMÁTICO)
  // ----------------------------------------------------
  const checkBackendAPI = async () => {
    setLoadingAPI(true);
    try {
      const res = await fetch(`${API_BASE_URL}/catalog/categories/`);
      if (res.ok) {
        setApiOnline(true);
        // Cargar productos reales de la API
        const prodRes = await fetch(`${API_BASE_URL}/catalog/products/`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.length > 0) {
            setProducts(prodData);
          }
        }
        // Cargar perfiles reales
        const profRes = await fetch(`${API_BASE_URL}/users/admin/profiles/`);
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.length > 0) setProfiles(profData);
        }
      } else {
        setApiOnline(false);
      }
    } catch (err) {
      setApiOnline(false);
    } finally {
      setLoadingAPI(false);
    }
  };

  useEffect(() => {
    checkBackendAPI();
  }, []);

  // Sincronizar el estado premium de la sesión local según los perfiles activos del usuario actual
  useEffect(() => {
    if (!currentUser) {
      setIsPremium(false);
      return;
    }
    const hasPremiumProfile = currentUser.assignments.some(
      (asg: any) => asg.profile_name === "Tutor Visual IA" && asg.is_active && !asg.has_expired
    );
    setIsPremium(hasPremiumProfile);
  }, [currentUser]);

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

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const getCartWeight = () => {
    return cart.reduce((acc, item) => acc + (item.product.weight_kg * item.quantity), 0);
  };

  const handleCheckout = () => {
    alert("¡Pedido realizado con éxito (Simulado)! Se ha descontado el stock de los productos. Se disparó la tarea asíncrona de confirmación por email en Celery.");
    
    // Simular el descuento de stock localmente
    setProducts(prevProducts => 
      prevProducts.map(p => {
        const cartItem = cart.find(item => item.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      })
    );

    // Guardar logs de auditoría
    const newLog = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      profile_name: "Tienda",
      action: "checkout" as any,
      performed_by_name: currentUser.username,
      notes: `Compra procesada con éxito. Total: $${getCartTotal().toLocaleString('es-AR')}, Peso: ${getCartWeight()}kg.`
    };
    setAuditLogs(prev => [newLog, ...prev]);
    clearCart();
  };

  // ----------------------------------------------------
  // LÓGICA DE SUSCRIPCIÓN PREMIUM (SIMULADA)
  // ----------------------------------------------------
  const togglePremiumSubscription = () => {
    if (!currentUser) return;

    if (isPremium) {
      // Cancelar suscripción
      const updatedAssignments = currentUser.assignments.filter((asg: any) => asg.profile_name !== "Tutor Visual IA");
      const updatedUser = { ...currentUser, assignments: updatedAssignments };
      
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
      
      // Log auditoría
      const audit = {
        id: auditLogs.length + 1,
        timestamp: new Date().toISOString(),
        username: currentUser.username,
        profile_name: "Tutor Visual IA",
        action: "subs_deactivate" as any,
        performed_by_name: "Sistema",
        notes: "Suscripción cancelada por el usuario. Perfil Tutor Visual IA revocado automáticamente."
      };
      setAuditLogs(prev => [audit, ...prev]);
      alert("Suscripción cancelada. Se ha revocado el perfil 'Tutor Visual IA' automáticamente.");
    } else {
      // Activar suscripción
      const premiumProfileData = MOCK_PROFILES.find(p => p.name === "Tutor Visual IA")!;
      const newAssignment = {
        id: Math.floor(Math.random() * 1000),
        profile: premiumProfileData.id,
        profile_name: premiumProfileData.name,
        is_active: true,
        expires_at: null,
        has_expired: false
      };
      
      const updatedUser = {
        ...currentUser,
        assignments: [...currentUser.assignments, newAssignment]
      };

      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      // Log auditoría
      const audit = {
        id: auditLogs.length + 1,
        timestamp: new Date().toISOString(),
        username: currentUser.username,
        profile_name: "Tutor Visual IA",
        action: "subs_activate" as any,
        performed_by_name: "Sistema",
        notes: "Suscripción simulada activa con éxito. Perfil Tutor Visual IA asignado de forma dinámica."
      };
      setAuditLogs(prev => [audit, ...prev]);
      alert("¡Gracias por suscribirte al Plan Premium! El perfil 'Tutor Visual IA' ha sido asignado dinámicamente.");
    }
  };

  // ----------------------------------------------------
  // CHAT TUTOR VISUAL IA (Simulación del RAG + Prompt JSON)
  // ----------------------------------------------------
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    // Simular el retardo de respuesta del LLM (Llama 3.3 vía Groq)
    setTimeout(() => {
      let replyText = "";
      let calculatedMaterials: { sku: string; qty: number; desc: string }[] = [];

      const query = userMsg.toLowerCase();
      
      // Simulación básica de RAG basada en palabras clave
      if (query.includes("pared") || query.includes("muro")) {
        // Encontrar ladrillo de 12 o 18 y cemento
        const l12 = products.find(p => p.sku === "Lad-001")!;
        const cem = products.find(p => p.sku === "Cem-001")!;
        
        replyText = "Para levantar tu pared, te recomiendo usar ladrillos huecos del 12 que otorgan un excelente balance de aislamiento térmico y ligereza estructural. La dosificación del mortero requiere cemento portland loma negra y cal hidratada.";
        calculatedMaterials = [
          { sku: "Lad-001", qty: 120, desc: "Ladrillos cerámicos huecos para 10m² de pared." },
          { sku: "Cem-001", qty: 3, desc: "Bolsas de cemento Portland para la mezcla de asentamiento." },
          { sku: "Cem-003", qty: 4, desc: "Bolsas de cal hidratada de 25kg." }
        ];
      } else if (query.includes("porcelanato") || query.includes("piso") || query.includes("ceramica")) {
        const adh = products.find(p => p.sku === "Adh-001")!;
        
        replyText = "Para colocar porcelanatos o cerámicos, es crucial contar con una carpeta nivelada y utilizar una mezcla adhesiva impermeable de alta adherencia tipo Weber. También calcularemos las pastinas grises para el rejuntado final.";
        calculatedMaterials = [
          { sku: "Adh-001", qty: 6, desc: "Pegamento Weber impermeable para revestir aprox 25m²." },
          { sku: "Cem-001", qty: 1, desc: "Cemento de refuerzo para base." }
        ];
      } else if (query.includes("durlock") || query.includes("techo") || query.includes("yeso")) {
        const durlock = products.find(p => p.sku === "Yes-001")!;
        
        replyText = "Para la colocación de cielorrasos o tabiquería interna de yeso, utilizaremos placas estándar Durlock de 12.5mm montadas sobre una estructura de perfiles metálicos galvanizados.";
        calculatedMaterials = [
          { sku: "Yes-001", qty: 8, desc: "Placas estándar de 12.5mm para cubrir el cielorraso." }
        ];
      } else {
        replyText = "He analizado tu solicitud. Para proyectos generales, te sugiero revisar las fichas técnicas del catálogo para asegurar la compatibilidad estructural y de dosificación.";
        calculatedMaterials = [
          { sku: "Cem-001", qty: 2, desc: "Cemento Loma Negra de uso general." }
        ];
      }

      setChatMessages(prev => [...prev, {
        sender: "ai",
        text: replyText,
        materials: calculatedMaterials
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const addCalculatedMaterialsToCart = (materials: { sku: string; qty: number }[]) => {
    let count = 0;
    materials.forEach(mat => {
      const prod = products.find(p => p.sku === mat.sku);
      if (prod) {
        addToCart(prod, mat.qty);
        count++;
      }
    });
    alert(`Se agregaron ${count} materiales calculados por la IA al carrito.`);
  };

  // ----------------------------------------------------
  // ACCIONES DE ADMINISTRACIÓN: ASIGNACIÓN DE ROLES (RF 6)
  // ----------------------------------------------------
  const toggleUserProfile = (user: any, profileId: number) => {
    const profile = profiles.find(p => p.id === profileId)!;
    const existingIndex = user.assignments.findIndex((asg: any) => asg.profile === profileId);

    let updatedAssignments = [...user.assignments];
    let actionType: "assign" | "revoke" = "assign";
    let logNote = "";

    if (existingIndex > -1) {
      // Revocar perfil
      updatedAssignments = updatedAssignments.filter(asg => asg.profile !== profileId);
      actionType = "revoke";
      logNote = `Perfil '${profile.name}' revocado manualmente desde el panel.`;
    } else {
      // Asignar perfil
      const expirationDate = profileExpirations[profileId];
      const expiresAt = expirationDate ? new Date(expirationDate).toISOString() : null;

      updatedAssignments.push({
        id: Math.floor(Math.random() * 1000),
        profile: profileId,
        profile_name: profile.name,
        is_active: true,
        expires_at: expiresAt,
        has_expired: false
      });
      actionType = "assign";
      logNote = `Perfil '${profile.name}' asignado manualmente. Vencimiento: ${expiresAt ? expirationDate : "Permanente"}`;
    }

    const updatedUser = { ...user, assignments: updatedAssignments };
    setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    
    if (selectedAdminUser.id === user.id) {
      setSelectedAdminUser(updatedUser);
    }
    // Si editamos el usuario actual en sesión
    if (currentUser.id === user.id) {
      setCurrentUser(updatedUser);
    }

    // Agregar al log de auditoría (RF 6.3)
    const audit = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      username: user.username,
      profile_name: profile.name,
      action: actionType,
      performed_by_name: currentUser.username,
      notes: logNote
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  // ----------------------------------------------------
  // ACCIONES DE CONFIGURACIÓN DINÁMICA DE PERFILES (RF 1.2, 6.2)
  // ----------------------------------------------------
  const handleTogglePermissionInProfile = (permissionId: number) => {
    if (!editingProfile) return;

    const exists = editingProfile.permissions_detail.some((pd: any) => pd.permission === permissionId);
    let updatedPermissions = [...editingProfile.permissions_detail];

    if (exists) {
      // Quitar permiso
      updatedPermissions = updatedPermissions.filter((pd: any) => pd.permission !== permissionId);
    } else {
      // Agregar permiso con alcance por defecto 'propios'
      const perm = permissions.find(p => p.id === permissionId)!;
      updatedPermissions.push({
        permission: permissionId,
        permission_code: perm.code,
        scope: "propios",
        module: perm.module
      });
    }

    const updatedProfile = { ...editingProfile, permissions_detail: updatedPermissions };
    setEditingProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? updatedProfile : p));

    // Audit Log
    const audit = {
      id: auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      username: `Perfil: ${editingProfile.name}`,
      profile_name: editingProfile.name,
      action: "assign" as any,
      performed_by_name: currentUser.username,
      notes: `Modificación de permisos del perfil. Total permisos actuales: ${updatedPermissions.length}.`
    };
    setAuditLogs(prev => [audit, ...prev]);
  };

  const handleUpdatePermissionScope = (permissionId: number, newScope: "propios" | "todos") => {
    if (!editingProfile) return;

    const updatedPermissions = editingProfile.permissions_detail.map((pd: any) => {
      if (pd.permission === permissionId) {
        return { ...pd, scope: newScope };
      }
      return pd;
    });

    const updatedProfile = { ...editingProfile, permissions_detail: updatedPermissions };
    setEditingProfile(updatedProfile);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? updatedProfile : p));
  };

  // Filtrado de Productos
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col premium-gradient-bg">
      {/* HEADER DE LA APLICACIÓN */}
      <header className="border-b border-[rgba(255,255,255,0.06)] bg-opacity-80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg text-black animate-float">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              MATERIALES <span className="text-amber-500">INTELIGENTES</span>
            </h1>
            <p className="text-[10px] text-gray-500 tracking-wider">PORTAL DE MATERIALES Y CÁLCULO IA</p>
          </div>
        </div>

        {/* CAMBIO DE USUARIO (SESIÓN DE PRUEBA) */}
        <div className="flex items-center gap-4">
          {/* Conexión API status */}
          <button 
            onClick={checkBackendAPI}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              apiOnline 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {loadingAPI ? (
              <Loader size={12} className="animate-spin" />
            ) : (
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
            )}
            API Django: {apiOnline ? "ONLINE" : "OFFLINE (Mock)"}
          </button>

          <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg p-1">
            <span className="text-xs text-gray-400 px-2">Actuar como:</span>
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  currentUser.id === u.id 
                    ? "bg-amber-500 text-black font-semibold" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {u.first_name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] px-4 py-1.5 rounded-lg border border-[rgba(255,255,255,0.05)]">
            <UserIcon size={16} className="text-amber-500" />
            <div className="text-left">
              <p className="text-xs font-semibold">{currentUser?.first_name} {currentUser?.last_name}</p>
              <div className="flex items-center gap-1">
                <p className="text-[10px] text-gray-400">@{currentUser?.username}</p>
                {isPremium && (
                  <span className="bg-amber-500/20 text-amber-500 text-[8px] font-bold px-1 rounded">PREMIUM</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <div className="flex-1 flex">
        {/* NAV LATERAL */}
        <aside className="w-64 border-r border-[rgba(255,255,255,0.06)] bg-gray-950/20 p-4 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-gray-500 px-3 py-2 uppercase tracking-wider">Módulos del MVP</p>
          
          <button
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

          <button
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

          <button
            onClick={() => setActiveTab("roles")}
            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "roles" 
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                : "text-gray-400 hover:bg-gray-900/40 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} />
              <span>Gestión de Roles</span>
            </div>
            <ChevronRight size={14} className="opacity-50" />
          </button>

          <button
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

          {/* CUADRO INFORMATIVO DE SUSCRIPCIÓN */}
          <div className="mt-auto p-4 rounded-xl glass-panel text-left flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500">
              <Sparkles size={14} />
              <span>Suscripción Premium</span>
            </div>
            <p className="text-[11px] text-gray-400">Accede de inmediato al cálculo de obra e insumos del Tutor IA.</p>
            <button
              onClick={togglePremiumSubscription}
              className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                isPremium 
                  ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20" 
                  : "bg-amber-500 hover:bg-amber-600 text-black"
              }`}
            >
              {isPremium ? "Cancelar Plan Premium" : "Activar Plan Premium"}
            </button>
            <p className="text-[9px] text-gray-500 text-center italic">Pagos simulados para MVP académico</p>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-8 flex flex-col overflow-y-auto max-h-[calc(100vh-80px)]">
          
          {/* TAB 1: CATÁLOGO DE PRODUCTOS (E-COMMERCE) */}
          {activeTab === "catalog" && (
            <div className="flex-1 flex gap-8 text-left">
              {/* LISTADO DE PRODUCTOS */}
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Catálogo de Materiales</h2>
                    <p className="text-xs text-gray-400">Navegación e indexación web optimizada para SEO mediante SSR.</p>
                  </div>
                  {/* Buscador */}
                  <div className="flex items-center bg-gray-900/80 border border-gray-800 rounded-lg px-3 py-2 w-72">
                    <Search size={16} className="text-gray-500 mr-2" />
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 w-full"
                    />
                  </div>
                </div>

                {/* Filtros Categorías */}
                <div className="flex gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedCategory === cat 
                          ? "bg-amber-500 text-black" 
                          : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grilla de Productos */}
                <div className="grid grid-cols-3 gap-6">
                  {filteredProducts.map(prod => (
                    <div key={prod.id} className="premium-card rounded-2xl overflow-hidden flex flex-col">
                      <div className="h-44 bg-gray-950/60 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="object-cover w-full h-full opacity-80"
                        />
                        <span className="absolute top-3 left-3 bg-black/60 border border-white/10 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                          {prod.sku}
                        </span>
                        {prod.stock <= 20 && (
                          <span className="absolute top-3 right-3 bg-red-500/20 border border-red-500/30 text-red-400 text-[8px] font-bold px-1.5 py-0.5 rounded">
                            Bajo Stock: {prod.stock} u
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{prod.category_name}</p>
                          <h3 className="font-bold text-sm text-white mt-1 leading-snug line-clamp-1">{prod.name}</h3>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{prod.description}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div>
                            <p className="text-[10px] text-gray-500">Precio unitario</p>
                            <p className="font-bold text-base text-white">${prod.price.toLocaleString('es-AR')}</p>
                          </div>
                          <button
                            onClick={() => addToCart(prod)}
                            disabled={prod.stock === 0}
                            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-800 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <ShoppingCart size={14} />
                            <span>{prod.stock === 0 ? "Sin Stock" : "Comprar"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARRITO DE COMPRAS */}
              <div className="w-80 border-l border-[rgba(255,255,255,0.06)] pl-8 flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingCart size={18} className="text-amber-500" />
                    <span>Tu Carrito</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1">Cálculo logístico por volumen y peso.</p>
                </div>

                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-800 rounded-2xl">
                    <ShoppingCart size={32} className="text-gray-600 animate-pulse-slow" />
                    <p className="text-xs text-gray-400 mt-3">El carrito está vacío.</p>
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto max-h-[350px] flex flex-col gap-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex gap-3 bg-gray-900/40 border border-gray-800 p-3 rounded-xl">
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-white line-clamp-1">{item.product.name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">${item.product.price.toLocaleString('es-AR')} c/u</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button 
                              onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                              className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-semibold">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                              className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col justify-between">
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-gray-500 hover:text-red-400 self-end"
                          >
                            <Trash2 size={12} />
                          </button>
                          <p className="text-xs font-bold text-white">${(item.product.price * item.quantity).toLocaleString('es-AR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="border-t border-gray-800 pt-4 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Peso Total:</span>
                        <span className="font-semibold text-white">{getCartWeight().toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-white mt-1">
                        <span>Total:</span>
                        <span className="text-amber-500">${getCartTotal().toLocaleString('es-AR')}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full btn-primary py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2"
                    >
                      <span>Confirmar Pedido (Simulado)</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TUTOR VISUAL IA (CHAT RAG) */}
          {activeTab === "tutor" && (
            <div className="flex-1 flex flex-col gap-4 text-left">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Bot className="text-amber-500" />
                  <span>Tutor Visual IA</span>
                </h2>
                <p className="text-xs text-gray-400">Asistente avanzado de cálculo de insumos, dosificación y guías de obra.</p>
              </div>

              {!isPremium ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-[rgba(245,158,11,0.15)] bg-amber-500/5 rounded-3xl max-w-2xl mx-auto my-8 gap-4">
                  <div className="bg-amber-500/10 p-4 rounded-full text-amber-500 border border-amber-500/20">
                    <Lock size={36} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Módulo Exclusivo para Usuarios Premium</h3>
                  <p className="text-sm text-gray-400 max-w-md">
                    El Tutor Visual IA realiza búsquedas semánticas y ejecuta cálculos matemáticos de dosificación según tus medidas para sugerir los materiales precisos del catálogo.
                  </p>
                  <button
                    onClick={togglePremiumSubscription}
                    className="btn-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 mt-2"
                  >
                    <Sparkles size={16} />
                    <span>Suscribirse al Plan Premium (Simulado)</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex gap-8">
                  {/* CHAT INTERACTIVE PANEL */}
                  <div className="flex-1 flex flex-col bg-gray-950/40 border border-gray-900 rounded-3xl overflow-hidden p-6 gap-4">
                    {/* Advertencia obligatoria de límites (6.2) */}
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl p-3 text-[11px] flex gap-2">
                      <HelpCircle size={16} className="shrink-0" />
                      <p>
                        <strong>Advertencia:</strong> Los cálculos provistos por el Tutor Visual son estimaciones basadas en fórmulas generales de construcción y no reemplazan el criterio certificado de un profesional o ingeniero.
                      </p>
                    </div>

                    {/* Ventana de Conversación */}
                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 max-h-[350px]">
                      {chatMessages.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`max-w-[85%] p-4 ${
                            msg.sender === "user" 
                              ? "self-end bubble-user text-white" 
                              : "self-start bubble-ai text-gray-200"
                          }`}
                        >
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* Listado de Materiales Sugeridos */}
                          {msg.materials && msg.materials.length > 0 && (
                            <div className="border-t border-[rgba(245,158,11,0.15)] pt-3 mt-3 flex flex-col gap-2">
                              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles size={12} />
                                <span>Materiales Calculados:</span>
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {msg.materials.map((mat: any, mIdx: number) => {
                                  const prod = products.find(p => p.sku === mat.sku);
                                  return (
                                    <div key={mIdx} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-[rgba(255,255,255,0.03)]">
                                      <div className="text-left">
                                        <p className="text-xs font-semibold text-white">{prod ? prod.name : mat.sku}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{mat.desc}</p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="bg-amber-500/10 text-amber-500 font-bold text-xs px-2 py-0.5 rounded">
                                          Cant: {mat.qty}
                                        </span>
                                        <button
                                          onClick={() => prod && addToCart(prod, mat.qty)}
                                          className="bg-amber-500 text-black p-1 rounded hover:bg-amber-600 transition-all"
                                        >
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <button
                                onClick={() => addCalculatedMaterialsToCart(msg.materials)}
                                className="w-full mt-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 text-[11px] font-bold py-2 rounded-lg transition-all"
                              >
                                Agregar Todos al Carrito
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="self-start bubble-ai p-4 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce"></span>
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      )}
                    </div>

                    {/* Input de Mensaje */}
                    <div className="flex gap-2 border-t border-gray-900 pt-4 mt-auto">
                      <input 
                        type="text" 
                        placeholder="Escribe tu consulta de obra... Ej: pared de 4x3 metros"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-grow bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 outline-none focus:border-amber-500/40 transition-all"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-3 rounded-xl text-xs font-bold transition-all"
                      >
                        Consultar
                      </button>
                    </div>
                  </div>

                  {/* SIDEBAR CON EJEMPLOS Y GUÍAS DE USO */}
                  <div className="w-72 flex flex-col gap-6">
                    <div className="bg-gray-950/20 border border-gray-900 p-5 rounded-3xl">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-500" />
                        <span>Ejemplos sugeridos</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-1">Copiar para consultar al Tutor IA.</p>
                      
                      <div className="flex flex-col gap-2 mt-4">
                        <button 
                          onClick={() => setChatInput("Quiero levantar una pared de 4x3 metros")}
                          className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                        >
                          "Quiero levantar una pared de 4x3 metros"
                        </button>
                        <button 
                          onClick={() => setChatInput("Voy a colocar porcelanato en un cuarto de 5x5m")}
                          className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                        >
                          "Voy a colocar porcelanato en un cuarto de 5x5m"
                        </button>
                        <button 
                          onClick={() => setChatInput("Quiero hacer un tabique de durlock de 3 metros de ancho")}
                          className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                        >
                          "Quiero hacer un tabique de durlock"
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GESTIÓN DE ROLES (COMPOSITE PERMISSION SETS) */}
          {activeTab === "roles" && (
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
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users size={18} className="text-amber-500" />
                    <span>Asignar Perfiles a Usuarios</span>
                  </h3>
                  
                  {/* Selector de Usuario a Configurar */}
                  <div className="flex gap-2">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedAdminUser(u)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          selectedAdminUser.id === u.id
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                            : "bg-gray-900 border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        {u.first_name} {u.last_name}
                      </button>
                    ))}
                  </div>

                  {/* Checklist de perfiles para el usuario seleccionado */}
                  <div className="flex flex-col gap-3 mt-2 border-t border-gray-900 pt-4">
                    <p className="text-xs text-gray-400">Marcar o desmarcar para asignar/revocar perfiles en tiempo real:</p>
                    
                    {profiles.map(profile => {
                      const assignment = selectedAdminUser.assignments.find((asg: any) => asg.profile === profile.id);
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
                            {isAssigned && assignment.expires_at && (
                              <span className="text-[9px] text-amber-400/80">
                                Vence: {new Date(assignment.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SECCIÓN: CONFIGURACIÓN DINÁMICA DE PERFILES Y PERMISOS */}
                <div className="bg-gray-950/40 border border-gray-900 rounded-3xl p-6 flex flex-col gap-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Shield size={18} className="text-amber-500" />
                    <span>Configurar Permisos del Perfil</span>
                  </h3>

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

                  {/* Lista de Permisos Atómicos */}
                  <div className="flex flex-col gap-2 mt-2 border-t border-gray-900 pt-4 overflow-y-auto max-h-[350px] pr-2">
                    <p className="text-xs text-gray-400 mb-2">Permisos atómicos asignados al perfil **{editingProfile?.name}**:</p>
                    
                    {permissions.map(perm => {
                      const profilePerm = editingProfile?.permissions_detail.find((pd: any) => pd.permission === perm.id);
                      const hasPerm = !!profilePerm;

                      return (
                        <div key={perm.id} className="bg-black/20 border border-gray-900 rounded-xl p-3 flex flex-col gap-3">
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

              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === "audits" && (
            <div className="flex-grow flex flex-col gap-6 text-left">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Clock className="text-amber-500" />
                  <span>Log de Auditoría de Seguridad</span>
                </h2>
                <p className="text-xs text-gray-400">Historial completo e inmutable de asignación y revocación de perfiles (RF 6.3).</p>
              </div>

              <div className="bg-gray-950/40 border border-gray-900 rounded-3xl overflow-hidden">
                <table className="w-full text-xs text-left text-gray-400 border-collapse">
                  <thead className="bg-gray-950/60 text-white font-semibold border-b border-gray-800">
                    <tr>
                      <th className="p-4">Fecha y Hora</th>
                      <th className="p-4">Usuario Destino</th>
                      <th className="p-4">Perfil</th>
                      <th className="p-4">Operación</th>
                      <th className="p-4">Ejecutado Por</th>
                      <th className="p-4">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-900/10">
                        <td className="p-4 font-mono text-[10px] text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-white font-medium">@{log.username}</td>
                        <td className="p-4">
                          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {log.profile_name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "assign" 
                              ? "bg-green-500/10 text-green-400" 
                              : log.action === "revoke" || log.action === "auto_expire"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}>
                            {log.action === "assign" ? "Asignar" : log.action === "revoke" ? "Revocar" : log.action === "auto_expire" ? "Expiración" : "Suscripción"}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-white">@{log.performed_by_name}</td>
                        <td className="p-4 text-[11px] max-w-xs truncate">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-4 px-6 flex items-center justify-between text-xs text-gray-500 bg-gray-950/20 mt-auto">
        <p>© 2026 Materiales Inteligentes E-commerce. Todos los derechos reservados.</p>
        <p className="font-mono">Next.js 15.1 + Django REST Framework + pgvector</p>
      </footer>
    </div>
  );
}
