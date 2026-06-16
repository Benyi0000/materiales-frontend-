import React, { useState, useEffect } from 'react';
import { ChevronRight, Home, ShoppingCart, Minus, Plus, Box, Package } from 'lucide-react';

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
}

interface ProductDetailProps {
  product: Product;
  products: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductDetail({
  product,
  products,
  onBack,
  onAddToCart,
  onSelectProduct
}: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [product.id]);

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);

  const outOfStock = product.stock === 0;

  // Productos relacionados: misma categoría, excluyendo el actual, máximo 4
  const relatedProducts = products
    .filter(p => p.category_name === product.category_name && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.3s_ease]">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-[#1a1a2e]/60 mb-8 font-medium">
        <button onClick={onBack} className="hover:text-[#E8612D] flex items-center gap-1 transition-colors">
          <Home size={14} /> Inicio
        </button>
        <ChevronRight size={14} className="opacity-50" />
        <span className="hover:text-[#1a1a2e] cursor-pointer" onClick={onBack}>Catálogo</span>
        <ChevronRight size={14} className="opacity-50" />
        <span className="hover:text-[#1a1a2e] cursor-pointer" onClick={onBack}>{product.category_name}</span>
        <ChevronRight size={14} className="opacity-50" />
        <span className="text-[#1a1a2e] font-semibold">{product.name}</span>
      </nav>

      {/* Grid Principal del Producto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        {/* Izquierda: Imagen */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 rounded-3xl aspect-square border border-[#e5e7eb] overflow-hidden flex items-center justify-center p-8 relative">
            <img
              src={product.image_url || `https://placehold.co/800x800/f5f5f5/999?text=${encodeURIComponent(product.name)}`}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/800x800/f5f5f5/999?text=${encodeURIComponent(product.sku || product.name)}`;
              }}
            />
            {outOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                <span className="bg-[#1a1a2e] text-white text-lg font-bold px-8 py-3 rounded-full shadow-xl">
                  Sin Stock
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Derecha: Información y Compra */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#E8612D] bg-[#E8612D]/10 px-3 py-1 rounded-full mb-3">
              {product.category_name}
            </span>
            <p className="text-sm text-gray-500 mb-1">SKU: {product.sku}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1a2e] leading-tight">
              {product.name}
            </h1>
          </div>

          <div className="mt-6 mb-8 flex items-end gap-4">
            <p className="text-4xl font-black text-[#1a1a2e]">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 border border-[#e5e7eb] flex flex-col gap-6">
            
            {/* Disponibilidad */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <span className="text-sm font-semibold text-[#1a1a2e]">Disponibilidad:</span>
              {outOfStock ? (
                <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">Agotado</span>
              ) : (
                <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {product.stock} disponibles
                </span>
              )}
            </div>

            {/* Selector de Cantidad */}
            {!outOfStock && (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-[#1a1a2e]">Cantidad:</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-white border border-[#e5e7eb] rounded-xl overflow-hidden h-12 shadow-sm">
                    <button 
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#1a1a2e] disabled:opacity-30 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <div className="w-16 h-full flex items-center justify-center font-bold text-[#1a1a2e] border-x border-[#e5e7eb]">
                      {quantity}
                    </div>
                    <button 
                      onClick={handleIncrement}
                      disabled={quantity >= product.stock}
                      className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#1a1a2e] disabled:opacity-30 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  {quantity >= product.stock && (
                    <span className="text-xs text-[#E8612D] font-medium animate-[fadeIn_0.2s_ease]">Máximo alcanzado</span>
                  )}
                </div>
              </div>
            )}

            {/* Botón Añadir */}
            <button
              type="button"
              onClick={() => onAddToCart(product, quantity)}
              disabled={outOfStock}
              className={`w-full h-14 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-md
                ${outOfStock 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-[#E8612D] text-white hover:bg-[#d4561f] hover:shadow-lg active:scale-[0.98]'
                }`}
            >
              <ShoppingCart size={20} />
              {outOfStock ? 'Producto Agotado' : `Agregar ${quantity} al Carrito`}
            </button>
          </div>

          {/* Características Rápidas */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-white border border-[#e5e7eb] p-4 rounded-xl">
              <div className="p-2 bg-orange-50 text-[#E8612D] rounded-lg">
                <Box size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Peso Aprox.</p>
                <p className="font-semibold text-sm text-[#1a1a2e]">{product.weight_kg ? `${product.weight_kg} kg` : 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white border border-[#e5e7eb] p-4 rounded-xl">
              <div className="p-2 bg-orange-50 text-[#E8612D] rounded-lg">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Formato</p>
                <p className="font-semibold text-sm text-[#1a1a2e]">{product.unit_of_sale_display || 'Unidad'}</p>
              </div>
            </div>
            {product.brand && (
              <div className="flex items-start gap-3 bg-white border border-[#e5e7eb] p-4 rounded-xl">
                <div className="p-2 bg-orange-50 text-[#E8612D] rounded-lg">
                  <Box size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Marca</p>
                  <p className="font-semibold text-sm text-[#1a1a2e]">{product.brand}</p>
                </div>
              </div>
            )}
            {product.material_display && (
              <div className="flex items-start gap-3 bg-white border border-[#e5e7eb] p-4 rounded-xl">
                <div className="p-2 bg-orange-50 text-[#E8612D] rounded-lg">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Material</p>
                  <p className="font-semibold text-sm text-[#1a1a2e]">{product.material_display}</p>
                </div>
              </div>
            )}
            {(product.length_cm || product.width_cm || product.height_cm) && (
              <div className="flex items-start gap-3 bg-white border border-[#e5e7eb] p-4 rounded-xl col-span-2">
                <div className="p-2 bg-orange-50 text-[#E8612D] rounded-lg">
                  <Box size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dimensiones</p>
                  <p className="font-semibold text-sm text-[#1a1a2e]">
                    {[product.length_cm, product.width_cm, product.height_cm].map(v => v ?? '—').join(' x ')} cm
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Descripción Técnica */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-[#1a1a2e] mb-4">Descripción Técnica</h3>
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-6 rounded-2xl border border-gray-100">
              {product.description || "No hay descripción detallada para este producto."}
            </div>
          </div>

        </div>
      </div>

      {/* Productos Relacionados */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-10 border-t border-[#e5e7eb]">
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-8">Productos Relacionados</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(prod => {
              const prodOutOfStock = prod.stock === 0;
              return (
                <div
                  key={prod.id}
                  className="group border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col transition-shadow duration-200 hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onSelectProduct(prod);
                  }}
                >
                  <div className="relative h-48 bg-gray-100 overflow-hidden p-4">
                    <img
                      src={prod.image_url || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.name)}`}
                      alt={prod.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                      onError={(e) => {
                        e.currentTarget.src = `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(prod.sku || prod.name)}`;
                      }}
                    />
                    {prodOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="bg-[#1a1a2e] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          Sin Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#E8612D] bg-[#E8612D]/10 px-2 py-0.5 rounded-full self-start">
                      {prod.category_name}
                    </span>
                    <h3 className="font-semibold text-sm text-[#1a1a2e] leading-snug line-clamp-2">
                      {prod.name}
                    </h3>
                    <p className="mt-auto pt-2 text-lg font-bold text-[#1a1a2e]">
                      {formatPrice(prod.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
