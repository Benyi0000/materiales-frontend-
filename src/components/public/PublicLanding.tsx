'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Filter,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Building2,
  LogOut
} from 'lucide-react';
import Cart from '../catalog/Cart';

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
  is_active?: boolean;
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
  addToCart?: (product: any, quantity?: number) => void;
  updateCartQty?: (productId: number, newQty: number) => void;
  removeFromCart?: (productId: number) => void;
  handleCheckout?: () => void;
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
  addToCart,
  updateCartQty,
  removeFromCart,
  handleCheckout
}: PublicLandingProps) {
  const router = useRouter();

  /* ---- Estado ---- */
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ---- Fetch inicial ---- */
  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('http://localhost:8000/api/catalog/products/'),
          fetch('http://localhost:8000/api/catalog/categories/'),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(Array.isArray(prodData) ? prodData : prodData.results ?? []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : catData.results ?? []);
        }
      } catch {
        /* silencioso: usa props iniciales si el backend no responde */
      }
    }
    fetchData();
  }, []);

  /* ---- Filtrado ---- */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      /* búsqueda (3+ chars) */
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length < 3 ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      /* categoría */
      const matchesCat =
        !selectedCategory ||
        p.category_name === selectedCategory ||
        (p.subcategory_names && p.subcategory_names.includes(selectedCategory));

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  /* ---- Helpers ---- */
  const toggleCategoryExpand = (catId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

  const goToLogin = () => router.push('/auth/login');

  const handleAddToCart = (p: Product) => {
    if (currentUser && addToCart) {
      addToCart(p);
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
    <div className="min-h-screen bg-white text-[#1a1a2e] font-sans flex flex-col">

      {/* ============================================================ */}
      {/*  A) HEADER                                                    */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
              <Building2 size={22} />
            </div>
            <span className="text-lg font-bold tracking-tight select-none">
              Craft<span className="text-[#E8612D]">IAr</span>
            </span>
          </div>

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1a1a2e]/70">
            <a href="#catalogo" className="hover:text-[#E8612D] transition-colors">
              Catálogo
            </a>
          </nav>

          {/* Barra de búsqueda — desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar materiales, herramientas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
              />
            </div>
          </div>

          {/* Acciones — desktop */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <button
                  type="button"
                  className="relative p-2 rounded-lg text-[#1a1a2e]/60 hover:text-[#E8612D] hover:bg-orange-50 transition-colors group"
                  title="Usuario"
                >
                  <div className="flex items-center gap-2">
                    <User size={20} />
                    <span className="text-sm font-semibold">{currentUser.username}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-lg text-[#1a1a2e]/60 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={goToLogin}
                className="p-2 rounded-lg text-[#1a1a2e]/60 hover:text-[#E8612D] hover:bg-orange-50 transition-colors"
                title="Iniciar sesión"
              >
                <User size={20} />
              </button>
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

        {/* Panel mobile desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-3 animate-[slideDown_0.2s_ease]">
            {/* Búsqueda mobile */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar materiales, herramientas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D]"
              />
            </div>
            <a
              href="#catalogo"
              className="block py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
            >
              Catálogo
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileSidebarOpen((v) => !v);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 py-2 text-sm font-medium text-[#1a1a2e]/70 hover:text-[#E8612D]"
            >
              <Filter size={16} /> Categorías
            </button>
            <div className="flex flex-col gap-3 pt-1">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-[#1a1a2e]/70 font-semibold px-2">
                    <User size={18} /> {currentUser.username}
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 px-2"
                  >
                    <LogOut size={18} /> Cerrar sesión
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={goToLogin}
                  className="flex items-center gap-2 text-sm text-[#1a1a2e]/70 hover:text-[#E8612D] px-2"
                >
                  <User size={18} /> Iniciar sesión
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/*  B) HERO BANNER                                               */}
      {/* ============================================================ */}
      <section className="relative w-full h-[380px] md:h-[440px] flex items-center justify-center overflow-hidden">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero_banner.png')" }}
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenido */}
        <div className="relative z-10 text-center px-6 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Construye mejor con{' '}
            <span className="text-[#E8612D]">CraftIAr</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-200 leading-relaxed">
            Materiales de construcción premium con herramientas de estimación basadas en IA.
          </p>
          <a
            href="#catalogo"
            className="mt-6 inline-block bg-white text-[#1a1a2e] font-semibold px-7 py-3 rounded-full text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Ver Promociones
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  C) CATÁLOGO                                                  */}
      {/* ============================================================ */}
      <section id="catalogo" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Encabezado de sección */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Todos los Materiales</h2>
          <span className="text-sm text-gray-500">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </span>
        </div>

        <div className="flex gap-8">
          {/* ---------- Sidebar categorías — desktop ---------- */}
          <aside className="hidden md:block w-[240px] shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1a1a2e] mb-4">
                <Filter size={16} className="text-[#E8612D]" />
                Categorías
              </div>

              {/* Opción "Todas" */}
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory
                    ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                    : 'text-[#1a1a2e]/70 hover:bg-gray-50'
                }`}
              >
                Todas
              </button>

              {/* Lista de categorías */}
              <ul className="mt-1 space-y-0.5">
                {categories.map((cat) => {
                  const subs = getSubcategories(cat);
                  const hasSubs = subs.length > 0;
                  const isExpanded = expandedCategories.has(cat.id);

                  return (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasSubs) toggleCategoryExpand(cat.id);
                          setSelectedCategory(cat.name);
                        }}
                        className={`w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === cat.name
                            ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                            : 'text-[#1a1a2e]/70 hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {hasSubs &&
                          (isExpanded ? (
                            <ChevronDown size={14} className="text-gray-400" />
                          ) : (
                            <ChevronRight size={14} className="text-gray-400" />
                          ))}
                      </button>

                      {/* Sub-categorías */}
                      {hasSubs && isExpanded && (
                        <ul className="ml-4 mt-0.5 space-y-0.5">
                          {subs.map((sub) => (
                            <li key={sub.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedCategory(sub.name)}
                                className={`w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors ${
                                  selectedCategory === sub.name
                                    ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                                    : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e]/70 hover:bg-gray-50'
                                }`}
                              >
                                {sub.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Sidebar mobile (overlay) */}
          {mobileSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setMobileSidebarOpen(false)}
              />
              <div className="relative z-50 bg-white w-72 max-w-[80vw] h-full overflow-y-auto shadow-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Filter size={16} className="text-[#E8612D]" /> Categorías
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !selectedCategory
                      ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                      : 'text-[#1a1a2e]/70 hover:bg-gray-50'
                  }`}
                >
                  Todas
                </button>

                <ul className="mt-1 space-y-0.5">
                  {categories.map((cat) => {
                    const subs = getSubcategories(cat);
                    const hasSubs = subs.length > 0;
                    const isExpanded = expandedCategories.has(cat.id);

                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onClick={() => {
                            if (hasSubs) toggleCategoryExpand(cat.id);
                            setSelectedCategory(cat.name);
                          }}
                          className={`w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === cat.name
                              ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                              : 'text-[#1a1a2e]/70 hover:bg-gray-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {hasSubs &&
                            (isExpanded ? (
                              <ChevronDown size={14} className="text-gray-400" />
                            ) : (
                              <ChevronRight size={14} className="text-gray-400" />
                            ))}
                        </button>
                        {hasSubs && isExpanded && (
                          <ul className="ml-4 mt-0.5 space-y-0.5">
                            {subs.map((sub) => (
                              <li key={sub.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(sub.name);
                                    setMobileSidebarOpen(false);
                                  }}
                                  className={`w-full text-left text-xs px-3 py-1.5 rounded-md transition-colors ${
                                    selectedCategory === sub.name
                                      ? 'bg-[#E8612D]/10 text-[#E8612D] font-semibold'
                                      : 'text-[#1a1a2e]/50 hover:text-[#1a1a2e]/70 hover:bg-gray-50'
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* ---------- Grilla de productos ---------- */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Search size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No se encontraron productos</p>
                <p className="text-sm mt-1">Probá con otro término de búsqueda o categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((prod) => {
                  const outOfStock = prod.stock === 0;

                  return (
                    <div
                      key={prod.id}
                      className="group border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col transition-shadow duration-200 hover:shadow-lg"
                    >
                      {/* Imagen */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        <img
                          src={prod.image_url || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.name)}`}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                        <div className="mt-auto flex items-center justify-between">
                          <p className="text-lg font-bold text-[#1a1a2e]">
                            {formatPrice(prod.price)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(prod)}
                            disabled={prod.stock === 0}
                            className="w-full mt-4 bg-[#E8612D] hover:bg-[#d4561f] disabled:bg-gray-200 disabled:text-gray-400 text-white py-2 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2"
                          >
                            <ShoppingCart size={16} />
                            {prod.stock === 0 ? 'Sin Stock' : 'Agregar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

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

      {/* Carrito de Compras (Si está autenticado) */}
      {currentUser && updateCartQty && removeFromCart && handleCheckout && (
        <div className="fixed top-20 right-8 z-[60] w-80 max-h-[80vh] overflow-hidden flex shadow-2xl rounded-xl">
          <Cart 
            cart={cart}
            updateCartQty={updateCartQty}
            removeFromCart={removeFromCart}
            handleCheckout={handleCheckout}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  D) FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="bg-[#1a1a2e] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-sm text-gray-400">
            © 2026 CraftIAr. Todos los derechos reservados.
          </p>
          <p className="mt-2 text-xs text-gray-500 font-mono">
            Next.js 15.1 + Django REST Framework + pgvector
          </p>
        </div>
      </footer>
    </div>
  );
}
