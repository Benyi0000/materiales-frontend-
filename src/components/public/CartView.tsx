import React, { useState } from 'react';
import { Minus, Plus, ShoppingCart, ArrowLeft, ChevronRight, Ticket, X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  image_url: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartViewProps {
  cart: CartItem[];
  cartMeta?: { subtotal: number; coupon_code: string | null; discount_amount: number; total: number };
  updateCartQty: (productId: number, newQty: number) => void;
  removeFromCart: (productId: number) => void;
  onBack: () => void;
  onCheckout: () => void;
  applyCoupon?: (code: string) => Promise<string | null>;
  removeCoupon?: () => void;
  isLoggedIn?: boolean;
}

export default function CartView({
  cart,
  cartMeta,
  updateCartQty,
  removeFromCart,
  onBack,
  onCheckout,
  applyCoupon,
  removeCoupon,
  isLoggedIn = false
}: CartViewProps) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  // Cupón de descuento (RN-06 a RN-10)
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = cartMeta?.discount_amount ?? 0;
  const appliedCoupon = cartMeta?.coupon_code ?? null;
  const finalTotal = discount > 0 ? totalPrice - discount : totalPrice;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !applyCoupon) return;
    setCouponLoading(true);
    setCouponError(null);
    const error = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (error) {
      setCouponError(error);
    } else {
      setCouponInput('');
    }
  };

  const formatPrice = (price: number) => `$${price.toLocaleString('es-AR')}`;

  if (cart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingCart size={48} />
        </div>
        <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-8 text-center max-w-md">
          ¿No sabés qué comprar? ¡Miles de productos te esperan en nuestro catálogo!
        </p>
        <button
          onClick={onBack}
          className="bg-[#E8612D] text-white hover:bg-[#d4561f] font-bold py-3 px-8 rounded-xl transition-all shadow-md active:scale-[0.98]"
        >
          Descubrir productos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-[fadeIn_0.3s_ease]">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={onBack} className="hover:text-[#E8612D] flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
        <ChevronRight size={14} className="text-gray-300" />
        <span className="text-[#1a1a2e] font-semibold">Resumen de compra</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Columna Izquierda: Lista de Productos (70%) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#e5e7eb] bg-gray-50">
              <h1 className="text-xl font-bold text-[#1a1a2e]">Productos</h1>
            </div>
            
            <div className="divide-y divide-gray-100">
              {cart.map((item) => {
                const p = item.product;
                const isMaxStock = item.quantity >= p.stock;
                
                return (
                  <div key={p.id} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50/50 transition-colors">
                    {/* Imagen */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2 shrink-0">
                      <img
                        src={p.image_url || `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(p.name)}`}
                        alt={p.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/400x300/f5f5f5/999?text=${encodeURIComponent(p.sku || p.name)}`;
                        }}
                      />
                    </div>
                    
                    {/* Detalles */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-[#1a1a2e] text-base leading-snug line-clamp-2">
                            {p.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">SKU: {p.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-xl text-[#1a1a2e]">
                            {formatPrice(p.price * item.quantity)}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatPrice(p.price)} c/u
                          </p>
                        </div>
                      </div>

                      {/* Controles: Cantidad y Eliminar */}
                      <div className="mt-auto pt-6 flex items-center justify-between">
                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Eliminar
                        </button>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-white border border-[#e5e7eb] rounded-lg overflow-hidden h-10 shadow-sm">
                            <button
                              onClick={() => updateCartQty(p.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <div className="w-12 h-full flex items-center justify-center font-bold text-[#1a1a2e] border-x border-[#e5e7eb] text-sm">
                              {item.quantity}
                            </div>
                            <button
                              onClick={() => updateCartQty(p.id, item.quantity + 1)}
                              disabled={isMaxStock}
                              className={`w-10 h-full flex items-center justify-center transition-colors ${
                                isMaxStock 
                                  ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                                  : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          {isMaxStock && (
                            <span className="text-xs text-[#E8612D] font-medium hidden sm:inline-block">
                              Stock máximo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Resumen Sticky (30%) */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-sm p-6">
            <h2 className="text-lg font-bold text-[#1a1a2e] border-b border-gray-100 pb-4 mb-4">
              Resumen de compra
            </h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Productos ({totalItems})</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Descuento ({appliedCoupon})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Envío</span>
                <span className="text-xs flex items-center text-gray-400">A calcular</span>
              </div>
            </div>

            {/* Cupón de descuento */}
            {isLoggedIn && (
              <div className="border-t border-gray-100 pt-4 mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                      <Ticket size={16} /> {appliedCoupon}
                    </span>
                    <button
                      onClick={() => removeCoupon && removeCoupon()}
                      className="text-green-700 hover:text-red-500 transition-colors p-1"
                      title="Quitar cupón"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        placeholder="Cupón de descuento"
                        className="flex-1 min-w-0 border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8612D] uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="bg-[#1a1a2e] text-white text-sm font-bold px-4 rounded-lg hover:bg-[#2a2a4e] disabled:opacity-40 transition-all"
                      >
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 mt-2">{couponError}</p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-[#1a1a2e]">Total</span>
                <span className="text-2xl font-black text-[#1a1a2e]">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-[#E8612D] text-white hover:bg-[#d4561f] font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-center"
            >
              Continuar compra
            </button>
            
            <div className="mt-4 text-center">
               <p className="text-xs text-gray-400">
                 Tus datos están protegidos.<br/>El stock se valida al confirmar la compra.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
