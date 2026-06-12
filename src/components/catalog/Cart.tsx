import React, { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Ticket, X } from "lucide-react";

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

interface CartProps {
  cart: CartItem[];
  cartMeta?: { subtotal: number; coupon_code: string | null; discount_amount: number; total: number };
  updateCartQty: (productId: number, newQty: number) => void;
  removeFromCart: (productId: number) => void;
  handleCheckout: () => void;
  applyCoupon?: (code: string) => Promise<string | null>;
  removeCoupon?: () => void;
}

export default function Cart({ cart, cartMeta, updateCartQty, removeFromCart, handleCheckout, applyCoupon, removeCoupon }: CartProps) {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const discount = cartMeta?.discount_amount ?? 0;
  const appliedCoupon = cartMeta?.coupon_code ?? null;

  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const getCartWeight = () => {
    return cart.reduce((acc, item) => acc + (item.product.weight_kg * item.quantity), 0);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !applyCoupon) return;
    setCouponLoading(true);
    setCouponError(null);
    const error = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (error) setCouponError(error);
    else setCouponInput("");
  };

  return (
    <div className="w-80 border-l border-[#e5e7eb] pl-8 flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-[#1a1a2e] flex items-center gap-2">
          <ShoppingCart size={18} className="text-[#E8612D]" />
          <span>Tu Carrito</span>
        </h3>
        <p className="text-[10px] text-[#6b7280] mt-1">Cálculo logístico por volumen y peso.</p>
      </div>

      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#e5e7eb] rounded-2xl">
          <ShoppingCart size={32} className="text-gray-300 animate-pulse-slow" />
          <p className="text-xs text-[#6b7280] mt-3">El carrito está vacío.</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto max-h-[350px] flex flex-col gap-3">
          {cart.map(item => (
            <div key={item.product.id} className="flex gap-3 bg-gray-50 border border-[#e5e7eb] p-3 rounded-xl text-left">
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-[#1a1a2e] line-clamp-1">{item.product.name}</h4>
                <p className="text-[10px] text-[#6b7280] mt-0.5">${item.product.price.toLocaleString('es-AR')} c/u</p>
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    type="button"
                    onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                    className="bg-gray-100 border border-[#e5e7eb] p-0.5 rounded hover:bg-gray-200 text-[#1a1a2e]"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-semibold text-[#1a1a2e]">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                    className="bg-gray-100 border border-[#e5e7eb] p-0.5 rounded hover:bg-gray-200 text-[#1a1a2e]"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <button 
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-gray-400 hover:text-red-500 self-end"
                >
                  <Trash2 size={12} />
                </button>
                <p className="text-xs font-bold text-[#1a1a2e]">${(item.product.price * item.quantity).toLocaleString('es-AR')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="border-t border-[#e5e7eb] pt-4 flex flex-col gap-4">
          {/* Cupón de descuento */}
          {applyCoupon && (
            appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <Ticket size={13} /> {appliedCoupon}
                </span>
                <button
                  type="button"
                  onClick={() => removeCoupon && removeCoupon()}
                  className="text-green-700 hover:text-red-500 transition-colors"
                  title="Quitar cupón"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Cupón"
                    className="flex-1 min-w-0 border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#E8612D] uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="bg-[#1a1a2e] text-white text-xs font-bold px-3 rounded-lg hover:bg-[#2a2a4e] disabled:opacity-40 transition-all"
                  >
                    {couponLoading ? '...' : 'Aplicar'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500">{couponError}</p>}
              </div>
            )
          )}

          <div className="flex flex-col gap-1.5 text-xs text-[#6b7280] text-left">
            <div className="flex justify-between">
              <span>Peso Total:</span>
              <span className="font-semibold text-[#1a1a2e]">{getCartWeight().toLocaleString()} kg</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Descuento ({appliedCoupon}):</span>
                <span>-${discount.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#1a1a2e] mt-1">
              <span>Total:</span>
              <span className="text-[#E8612D]">${(getCartTotal() - discount).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full bg-[#E8612D] hover:bg-[#d4551f] text-white py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 transition-all"
          >
            <span>Confirmar Pedido (Simulado)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
