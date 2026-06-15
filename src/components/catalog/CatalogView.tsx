import React, { useState } from "react";
import { Search, Building2, ShoppingCart } from "lucide-react";
import Cart from "./Cart";
import ProductDetail from "../public/ProductDetail";

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

interface CartItem {
  product: Product;
  quantity: number;
}

interface CatalogViewProps {
  products: Product[];
  addToCart: (product: Product, quantity?: number) => void;
  cart: CartItem[];
  cartMeta?: { subtotal: number; coupon_code: string | null; discount_amount: number; total: number };
  updateCartQty: (productId: number, newQty: number) => void;
  removeFromCart: (productId: number) => void;
  handleCheckout: () => void;
  applyCoupon?: (code: string) => Promise<string | null>;
  removeCoupon?: () => void;
}

export default function CatalogView({
  products,
  addToCart,
  cart,
  cartMeta,
  updateCartQty,
  removeFromCart,
  handleCheckout,
  applyCoupon,
  removeCoupon,
}: CatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  React.useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('product');
      if (productId) {
        const prod = products.find(p => p.id === parseInt(productId, 10));
        setSelectedProduct(prod || null);
      } else {
        setSelectedProduct(null);
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const selectProductHistory = (prod: Product | null) => {
    if (prod) {
      window.history.pushState({}, '', `?product=${prod.id}`);
      setSelectedProduct(prod);
    } else {
      window.history.pushState({}, '', window.location.pathname);
      setSelectedProduct(null);
    }
  };

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category_name)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || 
      p.category_name === selectedCategory || 
      (p.subcategory_names && p.subcategory_names.includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex gap-6 text-left">
      {selectedProduct ? (
        <div className="flex-1 overflow-y-auto">
          <ProductDetail
            product={selectedProduct}
            products={products}
            onBack={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              selectProductHistory(null);
            }}
            onAddToCart={addToCart}
            onSelectProduct={selectProductHistory}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Catálogo de Materiales</h2>
              <p className="text-sm text-[#6b7280]">{filteredProducts.length} {filteredProducts.length === 1 ? "producto" : "productos"}</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#E8612D]/30 focus:border-[#E8612D] transition-all"
              />
            </div>
          </div>

          {/* Filtros Categorías */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-[#E8612D] text-white"
                    : "bg-gray-50 border border-gray-200 text-[#6b7280] hover:text-[#1a1a2e] hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grilla de Productos */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Search size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No encontramos resultados</p>
              <p className="text-sm mt-1">Probá con otra palabra o cambiá de categoría.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map(prod => {
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
                        src={prod.image_url?.replace("via.placeholder.com", "placehold.co") || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.name)}`}
                        alt={prod.name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.sku || prod.name)}`;
                        }}
                      />
                      <span className="absolute top-3 left-3 bg-white/80 border border-gray-200 text-[#1a1a2e] text-[9px] px-2 py-0.5 rounded font-mono font-semibold">
                        {prod.sku}
                      </span>
                      {!outOfStock && prod.stock <= 20 && (
                        <span className="absolute top-3 right-3 bg-red-50 border border-red-200 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded">
                          Bajo stock: {prod.stock}u
                        </span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="bg-gray-800 text-white text-xs font-bold px-4 py-1.5 rounded-full">Sin stock</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#E8612D] bg-[#E8612D]/10 px-2 py-0.5 rounded-full">
                          {prod.category_name}
                        </span>
                        <h3 className="mt-2 font-semibold text-sm text-[#1a1a2e] leading-snug line-clamp-2">{prod.name}</h3>
                        <p className="text-xs text-[#6b7280] mt-1 line-clamp-2 leading-relaxed">{prod.description}</p>
                      </div>
                      <div className="mt-auto pt-2 flex items-end justify-between">
                        <p className="text-xl font-black text-[#1a1a2e]">${prod.price.toLocaleString('es-AR')}</p>
                        <span className="text-[10px] text-gray-400">Stock: {prod.stock}u</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
