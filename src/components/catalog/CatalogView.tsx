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
  weight_kg: number;
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
  updateCartQty: (productId: number, newQty: number) => void;
  removeFromCart: (productId: number) => void;
  handleCheckout: () => void;
}

export default function CatalogView({
  products,
  addToCart,
  cart,
  updateCartQty,
  removeFromCart,
  handleCheckout,
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
    <div className="flex-1 flex gap-8 text-left">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#1a1a2e]">Catálogo de Materiales</h2>
            <p className="text-xs text-[#6b7280]">Navegación e indexación web optimizada para SEO mediante SSR.</p>
          </div>
          {/* Buscador */}
          <div className="flex items-center bg-gray-50 border border-[#e5e7eb] rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-[#9ca3af] mr-2" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-[#1a1a2e] placeholder-gray-400 w-full"
            />
          </div>
        </div>

        {/* Filtros Categorías */}
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat 
                  ? "bg-[#E8612D] text-white" 
                  : "bg-gray-50 border border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a2e] hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grilla de Productos */}
        <div className="grid grid-cols-3 gap-6">
          {filteredProducts.map(prod => (
            <div 
              key={prod.id} 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                selectProductHistory(prod);
              }}
              className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="h-44 bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                <img 
                  src={prod.image_url?.replace("via.placeholder.com", "placehold.co")} 
                  alt={prod.name} 
                  className="object-contain mix-blend-multiply w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/300x200?text=${encodeURIComponent(prod.sku || prod.name)}`;
                  }}
                />
                <span className="absolute top-3 left-3 bg-white/80 border border-[#e5e7eb] text-[#1a1a2e] text-[9px] px-2 py-0.5 rounded font-mono font-semibold">
                  {prod.sku}
                </span>
                {prod.stock <= 20 && (
                  <span className="absolute top-3 right-3 bg-red-50 border border-red-200 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded">
                    Bajo Stock: {prod.stock} u
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <p className="text-[10px] text-[#E8612D] font-bold uppercase tracking-wider">{prod.category_name}</p>
                  <h3 className="font-bold text-sm text-[#1a1a2e] mt-1 leading-snug line-clamp-1">{prod.name}</h3>
                  <p className="text-xs text-[#6b7280] mt-2 line-clamp-2 leading-relaxed">{prod.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <p className="text-[10px] text-[#9ca3af]">Precio unitario</p>
                    <p className="font-bold text-lg text-[#1a1a2e]">${prod.price.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* CARRITO DE COMPRAS */}
      <Cart
        cart={cart}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        handleCheckout={handleCheckout}
      />
    </div>
  );
}
