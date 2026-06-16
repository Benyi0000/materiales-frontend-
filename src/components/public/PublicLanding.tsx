'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Sparkles,
  Bot,
  Minus,
  HelpCircle,
  PackageSearch
} from 'lucide-react';
import Cart from '../catalog/Cart';
import ProductDetail from './ProductDetail';
import CartView from './CartView';
import OrdersView from './OrdersView';
import TutorVisualChat from '@/components/tutor/TutorVisualChat';
import BannerCarousel from './BannerCarousel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  description: string;
  category_name: string;
  subcategory_names?: string[];
  image_url: string;
  stock: number;
  weight_kg?: number;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  unit_of_sale?: string;
  unit_of_sale_display?: string;
  brand?: string;
  material?: string;
  material_display?: string;
  is_active?: boolean;
}

interface FilterOption {
  value: string;
  label: string;
}

interface SubCategory {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  children?: SubCategory[];
  subcategories?: SubCategory[];
}

interface PublicLandingProps {
  products?: Product[];
  categories?: Category[];
  currentUser?: any;
  onLogout?: () => void;
  cart?: { product: any; quantity: number }[];
  cartMeta?: { subtotal: number; coupon_code: string | null; discount_amount: number; total: number };
  addToCart?: (product: any, quantity?: number) => void;
  updateCartQty?: (productId: number, newQty: number) => void;
  removeFromCart?: (productId: number) => void;
  handleCheckout?: () => void;
  applyCoupon?: (code: string) => Promise<string | null>;
  removeCoupon?: () => void;
  isPremium?: boolean;
  apiBaseUrl?: string;
  initialHeroBanner?: any;
}

/* ------------------------------------------------------------------ */
/*  Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function PublicLanding({
  products: initialProducts = [],
  categories: initialCategories = [],
  currentUser,
  onLogout,
  cart = [],
  cartMeta = { subtotal: 0, coupon_code: null, discount_amount: 0, total: 0 },
  addToCart = () => {},
  updateCartQty = () => {},
  removeFromCart = () => {},
  handleCheckout = () => {},
  applyCoupon = async () => "Función de cupones no disponible.",
  removeCoupon = () => {},
  isPremium = false,
  apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"),
  initialHeroBanner,
}: PublicLandingProps) {
  const router = useRouter();

  /* ---- Estado ---- */
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [filterOptions, setFilterOptions] = useState<{ brands: string[]; units: FilterOption[]; materials: FilterOption[] }>({ brands: [], units: [], materials: [] });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCartView, setShowCartView] = useState(false);
  const [showOrdersView, setShowOrdersView] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showTutorView, setShowTutorView] = useState(false);
  const [tutorWidgetOpen, setTutorWidgetOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{product: Product, quantity: number} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroBanner, setHeroBanner] = useState<any>(initialHeroBanner ?? null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const canVerSubs = currentUser?.is_superuser || (
    currentUser?.active_permissions && typeof currentUser.active_permissions === "object" &&
    "suscripciones.ver" in currentUser.active_permissions
  );

  // Fetch del banner solo si no fue provisto por el padre (recarga en background al cambiar de vista)
  useEffect(() => {
    if (initialHeroBanner !== undefined) return;
    fetch(`${API_BASE}/catalog/banners/public/?slot=hero`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { const list = Array.isArray(d) ? d : d.results || []; setHeroBanner(list[0] || null); })
      .catch(() => {});
  }, []);

  // Construye los query params de filtros activos (categoría, marca, material, unidad).
  const buildFilterParams = (): URLSearchParams => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category__name', selectedCategory);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (selectedMaterial) params.set('material', selectedMaterial);
    if (selectedUnit) params.set('unit_of_sale', selectedUnit);
    return params;
  };

  // Opciones de filtro (marcas en uso, materiales y unidades de venta) — una sola vez.
  useEffect(() => {
    fetch(`${apiBaseUrl}/catalog/products/filter_options/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setFilterOptions(d); })
      .catch(() => {});
  }, [apiBaseUrl]);

  /* ---- Fetch inicial ---- */
  useEffect(() => {
    async function fetchData() {
      try {
        const qs = buildFilterParams().toString();
        const url = `${apiBaseUrl}/catalog/products/${qs ? `?${qs}` : ''}`;
        const [prodRes, catRes] = await Promise.all([
          fetch(url),
          fetch(`${apiBaseUrl}/catalog/categories/`),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results ?? []);
          setNextPageUrl(prodData.next || null);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.results ?? []);
        }
      } catch {
        /* silencioso */
      }
    }
    fetchData();
  }, [selectedCategory, selectedBrand, selectedMaterial, selectedUnit, apiBaseUrl]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchInput]);

  /* ---- Sincronización de Historial (Botón Atrás) ---- */
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const view = urlParams.get('view');
      const productId = urlParams.get('product');

      if (view === 'cart') {
        setShowCartView(true);
        setShowOrdersView(false);
        setShowTutorView(false);
        setSelectedProduct(null);
      } else if (view === 'orders') {
        setShowOrdersView(true);
        setShowCartView(false);
        setShowTutorView(false);
        setSelectedProduct(null);
      } else if (view === 'tutor') {
        setShowTutorView(true);
        setShowCartView(false);
        setShowOrdersView(false);
        setSelectedProduct(null);
      } else if (productId) {
        const prod = products.find(p => p.id === parseInt(productId, 10));
        setSelectedProduct(prod || null);
        setShowCartView(false);
        setShowOrdersView(false);
        setShowTutorView(false);
      } else {
        setSelectedProduct(null);
        setShowCartView(false);
        setShowOrdersView(false);
        setShowTutorView(false);
      }
    };

    // Al montar, ver si hay ID en URL
    handlePopState();

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const selectProductHistory = (prod: Product | null) => {
    if (prod) {
      window.history.pushState({}, '', `?product=${prod.id}`);
      setSelectedProduct(prod);
      setShowCartView(false);
    } else {
      resetCatalog();
    }
  };

  const resetCatalog = () => {
    window.history.pushState({}, '', window.location.pathname);
    setSelectedProduct(null);
    setShowCartView(false);
    setShowOrdersView(false);
    setShowTutorView(false);
    setSearchInput('');
    setAppliedSearch('');
    setSelectedCategory(null);
    setSelectedBrand('');
    setSelectedMaterial('');
    setSelectedUnit('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCartView = () => {
    window.history.pushState({}, '', `?view=cart`);
    setShowCartView(true);
    setShowOrdersView(false);
    setShowTutorView(false);
    setSelectedProduct(null);
    setCartDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openOrdersView = () => {
    window.history.pushState({}, '', `?view=orders`);
    setShowOrdersView(true);
    setShowCartView(false);
    setShowTutorView(false);
    setSelectedProduct(null);
    setCartDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openTutorView = () => {
    window.history.pushState({}, '', `?view=tutor`);
    setShowTutorView(true);
    setShowCartView(false);
    setSelectedProduct(null);
    setCartDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ---- Utilidades ---- */
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    const loadMoreProducts = async () => {
    if (!nextPageUrl) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(nextPageUrl);
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => [...prev, ...(data.results || [])]);
        setNextPageUrl(data.next || null);
      }
    } catch (e) {
      console.error("Error loading more", e);
    }
    setIsLoadingMore(false);
  };

  const executeSearch = async (query: string) => {
    setSearchInput(query);
    setShowSuggestions(false);
    setSelectedProduct(null);
    setShowCartView(false);
    setMobileMenuOpen(false);

    setIsSearching(true);
    
    try {
      const q = query.trim();
      const filterParams = buildFilterParams();
      const filterQs = filterParams.toString();
      if (q === '') {
        const prodRes = await fetch(`${apiBaseUrl}/catalog/products/${filterQs ? `?${filterQs}` : ''}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results ?? []);
          setNextPageUrl(prodData.next || null);
        }
      } else {
        let searched = false;
        
        // Verificar si tiene el permiso específico o es superusuario
        const hasSemanticSearchPerm = currentUser?.is_superuser || (
          currentUser?.active_permissions && 
          typeof currentUser.active_permissions === 'object' && 
          "catalogo.busqueda_semantica" in currentUser.active_permissions
        );
        
        // Si tiene el permiso atómico para búsqueda semántica
        if (hasSemanticSearchPerm) {
          const token = localStorage.getItem('access_token');
          const headers: HeadersInit = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          
          const res = await fetch(`${apiBaseUrl}/catalog/products/semantic_search/?q=${encodeURIComponent(q)}`, {
            headers
          });
          
          if (res.ok) {
            const data = await res.json();
            setProducts(data.results || []);
            setNextPageUrl(data.next || null);
            searched = true;
          }
        }
        
        // Fallback a búsqueda clásica si no es premium o si falló (ej: 401/403)
        if (!searched) {
          const classicParams = buildFilterParams();
          classicParams.set('search', q);
          const res = await fetch(`${apiBaseUrl}/catalog/products/?${classicParams.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : data.results ?? []);
            setNextPageUrl(data.next || null);
          }
        }
      }
    } catch (e) {
      console.error("Error en búsqueda:", e);
    }

    setAppliedSearch(query);
    setIsSearching(false);
  };

  const searchSuggestions = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (q.length < 2) return [];
    
    const uniqueNames = new Set<string>();
    products.forEach(p => {
      if (p.name.toLowerCase().includes(q)) {
        uniqueNames.add(p.name);
      }
    });
    return Array.from(uniqueNames).slice(0, 5);
  }, [searchInput, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      /* categoría */
      const matchesCat =
        !selectedCategory ||
        p.category_name === selectedCategory ||
        (p.subcategory_names && p.subcategory_names.includes(selectedCategory));

      const matchesBrand = !selectedBrand || p.brand === selectedBrand;
      const matchesMaterial = !selectedMaterial || p.material === selectedMaterial;
      const matchesUnit = !selectedUnit || p.unit_of_sale === selectedUnit;

      return matchesCat && matchesBrand && matchesMaterial && matchesUnit;
    });
  }, [products, selectedCategory, selectedBrand, selectedMaterial, selectedUnit]);

  const hasActiveExtraFilters = !!(selectedBrand || selectedMaterial || selectedUnit);
  const clearExtraFilters = () => { setSelectedBrand(''); setSelectedMaterial(''); setSelectedUnit(''); };

  /* ---- Helpers ---- */

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

  const goToLogin = () => router.push('/auth/login');

  const handleAddToCart = (p: Product, quantity: number = 1) => {
    if (currentUser && addToCart) {
      addToCart(p, quantity);
      setLastAddedItem({ product: p, quantity });
      setCartDrawerOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const getSubcategories = (cat: Category): SubCategory[] =>
    cat.children ?? cat.subcategories ?? [];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className={`${showTutorView ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-white text-[#1a1a2e] font-sans flex flex-col`}>

      {/* ============================================================ */}
      {/*  A) HEADER                                                    */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div 
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={() => selectProductHistory(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="CraftIAr" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold tracking-tight select-none">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </div>

          {/* Barra de búsqueda — desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
            <div className="relative w-full">
              <button 
                onClick={() => executeSearch(searchInput)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E8612D] transition-colors"
              >
                <Search size={16} />
              </button>
              <input
                type="text"
                placeholder="Buscar materiales, herramientas..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                  if (e.target.value.trim() === '') {
                    setAppliedSearch('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => 
                      prev < searchSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
                      executeSearch(searchSuggestions[highlightedIndex]);
                    } else {
                      executeSearch(searchInput);
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
              />
            </div>
            {/* Sugerencias desktop */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-[fadeIn_0.1s_ease]">
                <ul className="py-2">
                  {searchSuggestions.map((sug, idx) => (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => executeSearch(sug)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          idx === highlightedIndex ? 'bg-gray-100 text-[#E8612D]' : 'text-[#1a1a2e] hover:bg-gray-50'
                        }`}
                      >
                        <Search size={12} className="inline-block mr-2 text-gray-400" />
                        {sug}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Acciones — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                {/* 1. Usuario (con menú) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-[#1a1a2e]/80 hover:text-[#E8612D] transition-colors"
                  >
                    <User size={18} />
                    <span className="text-sm font-semibold">{currentUser.username}</span>
                    <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-40 overflow-hidden ck-fade-in">
                        {canVerSubs && (
                          <button onClick={() => { setUserMenuOpen(false); router.push("/mis-suscripciones"); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1a1a2e] hover:bg-orange-50 text-left">
                            <Sparkles size={16} className="text-[#E8612D]" /> Ver mis suscripciones
                          </button>
                        )}
                        <button onClick={() => { setUserMenuOpen(false); onLogout && onLogout(); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 text-left border-t border-gray-100">
                          <LogOut size={16} /> Cerrar sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. TutorIA: activo si suscripto; gris si tiene permiso pero no suscripto */}
                {isPremium ? (
                  <button
                    type="button"
                    onClick={openTutorView}
                    className={`flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors ${showTutorView ? 'text-amber-700' : 'text-amber-600 hover:text-amber-700'}`}
                    title="TutorIA"
                  >
                    <Sparkles size={18} />
                    <span className="hidden lg:inline">TutorIA</span>
                  </button>
                ) : canVerSubs ? (
                  <button
                    type="button"
                    onClick={() => router.push("/planes")}
                    className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-400 hover:text-[#E8612D] transition-colors"
                    title="Suscribite para acceder al TutorIA"
                  >
                    <Sparkles size={18} />
                    <span className="hidden lg:inline">TutorIA</span>
                  </button>
                ) : null}

                {/* 3. Mis Pedidos */}
                <button
                  type="button"
                  onClick={openOrdersView}
                  className={`flex items-center gap-2 px-2 py-2 text-sm font-medium transition-colors ${
                    showOrdersView ? 'text-[#E8612D]' : 'text-[#1a1a2e]/70 hover:text-[#E8612D]'
                  }`}
                  title="Mis pedidos"
                >
                  <PackageSearch size={20} />
                  <span className="hidden lg:inline">Mis pedidos</span>
                </button>

                {/* 4. Carrito */}
                <button
                  type="button"
                  onClick={() => openCartView()}
                  className="relative p-2 text-[#1a1a2e]/70 hover:text-[#E8612D] transition-colors"
                >
                  <ShoppingCart size={24} />
                  {totalCartItems > 0 && (
                    <span className="absolute top-0 right-0 bg-[#E8612D] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {totalCartItems}
                    </span>
                  )}
                </button>


              </>
            ) : (
              <>
                {/* Carrito (anónimo) */}
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(true)}
                  className="relative p-2 text-[#1a1a2e]/70 hover:text-[#E8612D] transition-colors"
                >
                  <ShoppingCart size={24} />
                  {totalCartItems > 0 && (
                    <span className="absolute top-0 right-0 bg-[#E8612D] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {totalCartItems}
                    </span>
                  )}
                </button>

                {/* Iniciar sesión */}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="p-2 rounded-lg text-[#1a1a2e]/60 hover:text-[#E8612D] hover:bg-orange-50 transition-colors"
                  title="Iniciar sesión"
                >
                  <User size={20} />
                </button>
              </>
            )}
          </div>

          {/* Hamburguesa — mobile */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-[#1a1a2e]/70 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Fila Inferior: Navegación (Solo Desktop) */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 items-center gap-8 text-sm font-medium text-[#1a1a2e]/70">
          
          {/* Mega Menú de Categorías al Hover */}
          <div className="group relative">
            <button className="flex items-center gap-1.5 hover:text-[#E8612D] transition-colors py-1">
              Categorías <ChevronDown size={14} className="transition-transform group-hover:rotate-180" />
            </button>
            
            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-[700px] flex overflow-hidden min-h-[350px]">
                {/* Columna Izquierda: Categorías Principales */}
                <div className="w-[240px] bg-gray-50 flex flex-col py-2 border-r border-gray-100 relative shrink-0">
                  {categories.map((c) => (
                    <div key={c.id} className="group/cat px-4 py-3 hover:bg-white cursor-pointer flex justify-between items-center text-sm text-[#1a1a2e] transition-colors border-l-2 border-transparent hover:border-[#E8612D]">
                      <span className="truncate">{c.name}</span>
                      <ChevronRight size={14} className="text-gray-400 opacity-0 group-hover/cat:opacity-100 transition-opacity" />
                      
                      {/* Panel Derecho: Subcategorías (Absoluto respecto a la columna izquierda) */}
                      <div className="absolute left-[240px] top-0 w-[460px] h-full bg-white hidden group-hover/cat:flex flex-col p-6 cursor-default z-10 border-l border-gray-50">
                        <h3 className="font-bold text-lg mb-4 text-[#1a1a2e] border-b border-gray-100 pb-2">{c.name}</h3>
                        {c.subcategories && c.subcategories.length > 0 ? (
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {c.subcategories.map(sub => (
                              <button 
                                key={sub.id} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCategory(sub.name);
                                  executeSearch('');
                                  // El hover desaparece al quitar el mouse del menú, no necesitamos estado local extra.
                                }}
                                className="text-sm text-gray-500 hover:text-[#E8612D] text-left truncate transition-colors"
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No hay subcategorías disponibles.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <a href="#" className="hover:text-[#E8612D] transition-colors py-1">
            Ayuda
          </a>
        </div>

        {/* Panel mobile desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-3 animate-[slideDown_0.2s_ease]">
            {/* Búsqueda mobile */}
            <div className="relative">
              <button 
                onClick={() => executeSearch(searchInput)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#E8612D]"
              >
                <Search size={16} />
              </button>
              <input
                type="text"
                placeholder="Buscar materiales, herramientas..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                  if (e.target.value.trim() === '') {
                    setAppliedSearch('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => 
                      prev < searchSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (highlightedIndex >= 0 && highlightedIndex < searchSuggestions.length) {
                      executeSearch(searchSuggestions[highlightedIndex]);
                    } else {
                      executeSearch(searchInput);
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D]"
              />
              {/* Sugerencias mobile */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden z-50">
                  <ul className="py-1">
                    {searchSuggestions.map((sug, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => executeSearch(sug)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            idx === highlightedIndex ? 'bg-gray-100 text-[#E8612D]' : 'text-[#1a1a2e] hover:bg-gray-50'
                          }`}
                        >
                          <Search size={12} className="inline-block mr-2 text-gray-400" />
                          {sug}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 border-t border-gray-100 mt-2 pt-2">
              <a
                href="#"
                className="w-full flex items-center gap-2 py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
              >
                <HelpCircle size={16} /> Ayuda
              </a>
            </div>
            <div className="flex flex-col gap-3 pt-1 border-t border-gray-100 mt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  currentUser ? openCartView() : setShowLoginPrompt(true);
                }}
                className="flex items-center justify-between py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} /> Carrito
                </div>
                {totalCartItems > 0 && (
                  <span className="bg-[#E8612D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {totalCartItems}
                  </span>
                )}
              </button>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openOrdersView();
                  }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
                >
                  <PackageSearch size={18} /> Mis pedidos
                </button>
              )}
              {isPremium ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openTutorView();
                  }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-amber-600"
                >
                  <Sparkles size={18} /> TutorIA
                </button>
              ) : canVerSubs ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/planes");
                  }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-gray-400 hover:text-[#E8612D]"
                >
                  <Sparkles size={18} /> TutorIA
                </button>
              ) : null}
              {canVerSubs && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/mis-suscripciones");
                  }}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
                >
                  <Sparkles size={18} /> Mis suscripciones
                </button>
              )}
              {currentUser ? (
                <>
                  <div className="flex items-center gap-2 py-2 text-sm text-[#1a1a2e]/70 font-semibold">
                    <User size={18} /> Mi Perfil ({currentUser.username})
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-2 py-2 text-sm text-red-500 hover:text-red-600"
                  >
                    <LogOut size={18} /> Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={goToLogin}
                  className="flex items-center gap-2 py-2 text-sm text-[#1a1a2e]/70 hover:text-[#E8612D]"
                >
                  <User size={18} /> Iniciar sesión
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {showTutorView ? (
        <div className="flex-1 overflow-hidden bg-white flex flex-col animate-[fadeIn_0.2s_ease] w-full">
           
           {/* Área del Chat */}
           <TutorVisualChat 
               products={products}
               addToCart={handleAddToCart}
               isPremium={isPremium}
               apiBaseUrl={apiBaseUrl}
               isAdmin={false}
               googleApiKeyConfigured={currentUser?.google_api_key_configured ?? false}
               layoutMode="full"
             />
        </div>
      ) : showOrdersView ? (
        <OrdersView
          apiBaseUrl={apiBaseUrl}
          onBack={resetCatalog}
        />
      ) : showCartView ? (
        <CartView
          cart={cart}
          cartMeta={cartMeta}
          updateCartQty={updateCartQty}
          removeFromCart={removeFromCart}
          onBack={resetCatalog}
          onCheckout={handleCheckout}
          applyCoupon={applyCoupon}
          removeCoupon={removeCoupon}
          isLoggedIn={!!currentUser}
        />
      ) : selectedProduct ? (
        <ProductDetail
          product={selectedProduct}
          products={products}
          onBack={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            selectProductHistory(null);
          }}
          onAddToCart={handleAddToCart}
          onSelectProduct={selectProductHistory}
        />
      ) : (
        <>
          {/* ============================================================ */}
          {/*  HERO BANNER                                                  */}
          {/* ============================================================ */}
          {appliedSearch.trim() === '' && !selectedCategory && (
            <section className="relative w-full h-[260px] sm:h-[340px] md:h-[440px] flex items-center justify-center overflow-hidden">
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                style={{ backgroundImage: `url('${heroBanner?.image_url || "/hero_banner.png"}')` }}
              />
              {/* Overlay oscuro (opacidad configurable del banner) */}
              <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(heroBanner?.overlay_opacity ?? 55) / 100})` }} />

              {/* Contenido */}
              <div className="relative z-10 text-center px-4 sm:px-6 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white leading-tight">
                  {heroBanner?.title ? (
                    heroBanner.title
                  ) : (
                    <>Construye mejor con{' '}<span className="text-[#E8612D]">CraftIAr</span></>
                  )}
                </h1>
                <p className="mt-3 text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">
                  {heroBanner?.subtitle || "Materiales de construcción premium con herramientas de estimación basadas en IA."}
                </p>
                {heroBanner?.link ? (
                  <a
                    href={heroBanner.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-block bg-white text-[#1a1a2e] font-semibold px-7 py-3 rounded-full text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Ver Promociones
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="mt-6 inline-block bg-white text-[#1a1a2e] font-semibold px-7 py-3 rounded-full text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Ver Promociones
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Banners promocionales dinámicos (Gestión Interna) */}
          {appliedSearch.trim() === '' && !selectedCategory && <BannerCarousel />}

      {/* ============================================================ */}
      {/*  C) CATÁLOGO                                                  */}
      {/* ============================================================ */}
      <section id="catalogo" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Todos los Materiales</h2>
          <span className="text-sm text-gray-500">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        {/* Filtros: marca, material, unidad de venta */}
        {(filterOptions.brands.length > 0 || filterOptions.materials.length > 0) && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="text-sm border border-gray-200 rounded-full px-4 py-2 bg-white text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
            >
              <option value="">Material: todos</option>
              {filterOptions.materials.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="text-sm border border-gray-200 rounded-full px-4 py-2 bg-white text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
            >
              <option value="">Marca: todas</option>
              {filterOptions.brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="text-sm border border-gray-200 rounded-full px-4 py-2 bg-white text-[#1a1a2e] outline-none focus:border-[#E8612D]/40"
            >
              <option value="">Unidad: todas</option>
              {filterOptions.units.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            {hasActiveExtraFilters && (
              <button
                type="button"
                onClick={clearExtraFilters}
                className="text-sm text-[#E8612D] font-semibold hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <div>
          {/* ---------- Grilla de productos ---------- */}
          <div>
            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="border border-gray-100 rounded-2xl h-80 bg-gray-100 flex flex-col p-4 gap-4">
                    <div className="w-full h-32 bg-gray-200 rounded-xl"></div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                    <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                    <div className="w-1/3 h-6 bg-gray-200 rounded mt-auto"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Search size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No encontramos resultados para tu búsqueda</p>
                <p className="text-sm mt-1">Probá con otra palabra o borrá la barra para ver el catálogo completo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((prod) => {
                  const outOfStock = prod.stock === 0;

                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        selectProductHistory(prod);
                      }}
                      className="group border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer"
                    >
                      {/* Imagen */}
                      <div className="relative h-40 sm:h-48 bg-gray-100 overflow-hidden p-4">
                        <img
                          src={prod.image_url || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.name)}`}
                          alt={prod.name}
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.sku || prod.name)}`;
                          }}
                        />
                        {outOfStock && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="bg-gray-800 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                              Sin Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col gap-3">
                        <div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#E8612D] bg-[#E8612D]/10 px-2 py-0.5 rounded-full">
                            {prod.category_name}
                          </span>
                          <h3 className="mt-2 font-semibold text-sm text-[#1a1a2e] leading-snug line-clamp-2">
                            {prod.name}
                          </h3>
                        </div>

                        <div className="mt-auto pt-2">
                          <p className="text-xl font-black text-[#1a1a2e]">
                            {formatPrice(prod.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {nextPageUrl && !isSearching && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={isLoadingMore}
                  className="bg-white border-2 border-[#E8612D] text-[#E8612D] hover:bg-[#E8612D] hover:text-white font-bold py-3 px-8 rounded-full transition-all flex items-center gap-2"
                >
                  {isLoadingMore ? "Cargando..." : "Cargar Más Productos"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
      </>
      )}

      {/* Modal / Toast de Login Requerido */}
      {showLoginPrompt && !currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1a1a2e]/40 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[slideUp_0.3s_ease]">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#E8612D] mb-4">
                <ShoppingCart size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                Inicia sesión
              </h3>
              <p className="text-sm text-[#1a1a2e]/70 mb-6">
                Debes iniciar sesión o crear una cuenta para agregar productos al
                carrito y realizar tu pedido.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={goToLogin}
                  className="w-full bg-[#E8612D] text-white py-2.5 rounded-xl font-semibold hover:bg-[#d4561f] transition-colors"
                >
                  Ir al Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full bg-gray-50 text-[#1a1a2e]/70 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer de Carrito (Panel lateral de confirmación) */}
      {cartDrawerOpen && lastAddedItem && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            style={{ animation: 'fadeInBackdrop 0.3s ease forwards' }}
            onClick={() => setCartDrawerOpen(false)}
          />
          
          {/* Panel Lateral */}
          <div 
            className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
            style={{ animation: 'slideInRight 0.3s ease forwards' }}
          >
            {/* Header Drawer */}
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
              <h2 className="text-lg font-bold text-[#1a1a2e] flex items-center gap-2">
                <ShoppingCart size={20} className="text-[#E8612D]" />
                Agregado al carrito
              </h2>
              <button 
                onClick={() => setCartDrawerOpen(false)}
                className="text-gray-400 hover:text-[#1a1a2e] transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Contenido Drawer */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex gap-4 mb-6">
                <div className="w-20 h-20 bg-gray-50 border border-[#e5e7eb] rounded-xl flex items-center justify-center p-2 shrink-0">
                  <img 
                    src={lastAddedItem.product.image_url || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(lastAddedItem.product.name)}`} 
                    alt={lastAddedItem.product.name} 
                    className="w-full h-full object-contain mix-blend-multiply"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(lastAddedItem.product.sku || lastAddedItem.product.name)}`;
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-[#1a1a2e] leading-snug line-clamp-2">
                    {lastAddedItem.product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Cantidad añadida: <span className="font-bold text-[#1a1a2e]">{lastAddedItem.quantity}</span>
                  </p>
                  <p className="text-[#E8612D] font-bold text-sm mt-1">
                    Subtotal: ${ (lastAddedItem.product.price * lastAddedItem.quantity).toLocaleString('es-AR') }
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-[#e5e7eb]">
                 <div className="flex justify-between text-sm">
                   <span className="text-gray-500">Total en carrito:</span>
                   <span className="font-bold text-[#1a1a2e]">{totalCartItems} {totalCartItems === 1 ? 'artículo' : 'artículos'}</span>
                 </div>
              </div>
            </div>
            
            {/* Footer Drawer */}
            <div className="p-6 border-t border-[#e5e7eb] bg-white shrink-0 flex flex-col gap-3">
              <button 
                onClick={openCartView}
                className="w-full bg-[#E8612D] text-white hover:bg-[#d4561f] font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Ver Carrito Completo
              </button>
              <button 
                onClick={() => setCartDrawerOpen(false)}
                className="w-full bg-white text-[#1a1a2e] border border-[#e5e7eb] hover:bg-gray-50 font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
              >
                Seguir Comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  D) FOOTER                                                    */}
      {/* ============================================================ */}
      {!showTutorView && (
        <footer className="bg-[#1a1a2e] mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Craftiar. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      )}

      {/* ============================================================ */}
      {/*  TUTOR FLOATING WIDGET (Abajo a la Derecha)                   */}
      {/* ============================================================ */}
      {isPremium && !showTutorView && (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4 pointer-events-none">
          {/* Ventana Expandida */}
          <div className={`${tutorWidgetOpen ? 'flex' : 'hidden'} w-[380px] max-w-[calc(100vw-32px)] h-[550px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex-col border border-gray-200 overflow-hidden transition-all origin-bottom-right pointer-events-auto animate-[slideUp_0.3s_ease]`}>
            {/* Header del Chat Flotante */}
            <div className="flex items-center justify-between p-3 border-b border-[#E8612D]/20 bg-[#E8612D] text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Bot size={20} />
                <span className="text-sm">TutorIA</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setTutorWidgetOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title="Minimizar"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
            
            {/* Contenedor del Chat Interno */}
            <div className="flex-1 overflow-hidden bg-white flex flex-col">
               <TutorVisualChat 
                 products={products}
                 addToCart={handleAddToCart}
                 isPremium={isPremium}
                 apiBaseUrl={apiBaseUrl}
                 isAdmin={false}
                 googleApiKeyConfigured={currentUser?.google_api_key_configured ?? false}
                 layoutMode="widget"
               />
            </div>
          </div>

          {/* Botón Flotante Minimizado */}
          {!tutorWidgetOpen && (
            <button
              onClick={() => setTutorWidgetOpen(true)}
              className="bg-[#E8612D] text-white p-4 rounded-full shadow-lg hover:bg-[#d4551f] transition-transform hover:scale-105 flex items-center justify-center pointer-events-auto"
              title="Abrir TutorIA"
            >
              <Sparkles size={24} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
