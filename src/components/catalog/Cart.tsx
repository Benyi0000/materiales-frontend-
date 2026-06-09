import React from "react";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";

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
  updateCartQty: (productId: number, newQty: number) => void;
  removeFromCart: (productId: number) => void;
  handleCheckout: () => void;
}

export default function Cart({ cart, updateCartQty, removeFromCart, handleCheckout }: CartProps) {
  const getCartTotal = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const getCartWeight = () => {
    return cart.reduce((acc, item) => acc + (item.product.weight_kg * item.quantity), 0);
  };

  return (
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
            <div key={item.product.id} className="flex gap-3 bg-gray-900/40 border border-gray-800 p-3 rounded-xl text-left">
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-white line-clamp-1">{item.product.name}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">${item.product.price.toLocaleString('es-AR')} c/u</p>
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    type="button"
                    onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                    className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-semibold">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                    className="bg-gray-800 p-0.5 rounded hover:bg-gray-700"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col justify-between">
                <button 
                  type="button"
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
          <div className="flex flex-col gap-1.5 text-xs text-gray-400 text-left">
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
            type="button"
            onClick={handleCheckout}
            className="w-full btn-primary py-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2"
          >
            <span>Confirmar Pedido (Simulado)</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
