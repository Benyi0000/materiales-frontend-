import React, { useState } from "react";
import { Search, Building2, ShoppingCart } from "lucide-react";
import Cart from "./Cart";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  description: string;
  category_name: string;
  image_url: string;
  stock: number;
  weight_kg: number;
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

  const categories = ["Todos", ...Array.from(new Set(products.map(p => p.category_name)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || p.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
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
              type="button"
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
                    type="button"
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
      <Cart
        cart={cart}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        handleCheckout={handleCheckout}
      />
    </div>
  );
}
