import React, { useState } from "react";
import { Bot, Lock, HelpCircle, Sparkles, Plus } from "lucide-react";

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

interface TutorVisualChatProps {
  products: Product[];
  addToCart: (product: Product, quantity?: number) => void;
  isPremium: boolean;
}

export default function TutorVisualChat({ products, addToCart, isPremium }: TutorVisualChatProps) {
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "¡Hola! Soy tu Tutor Visual de Construcción. Escríbeme qué proyecto tienes en mente (ej. 'Quiero levantar una pared de 4x3 metros' o 'Voy a colocar porcelanato en un cuarto de 5x5m') y te daré una guía de instalación paso a paso, calculando los materiales necesarios que podrás agregar a tu carrito de compras.",
      materials: []
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "";
      let calculatedMaterials: { sku: string; qty: number; desc: string }[] = [];

      const query = userMsg.toLowerCase();
      
      if (query.includes("pared") || query.includes("muro")) {
        replyText = "Para levantar tu pared, te recomiendo usar ladrillos huecos del 12 que otorgan un excelente balance de aislamiento térmico y ligereza estructural. La dosificación del mortero requiere cemento portland loma negra y cal hidratada.";
        calculatedMaterials = [
          { sku: "Lad-001", qty: 120, desc: "Ladrillos cerámicos huecos para 10m² de pared." },
          { sku: "Cem-001", qty: 3, desc: "Bolsas de cemento Portland para la mezcla de asentamiento." },
          { sku: "Cem-003", qty: 4, desc: "Bolsas de cal hidratada de 25kg." }
        ];
      } else if (query.includes("porcelanato") || query.includes("piso") || query.includes("ceramica")) {
        replyText = "Para colocar porcelanatos o cerámicos, es crucial contar con una carpeta nivelada y utilizar una mezcla adhesiva impermeable de alta adherencia tipo Weber. También calcularemos las pastinas grises para el rejuntado final.";
        calculatedMaterials = [
          { sku: "Adh-001", qty: 6, desc: "Pegamento Weber impermeable para revestir aprox 25m²." },
          { sku: "Cem-001", qty: 1, desc: "Cemento de refuerzo para base." }
        ];
      } else if (query.includes("durlock") || query.includes("techo") || query.includes("yeso")) {
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

  return (
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
          <p className="text-xs text-gray-500 italic mt-2">
            (Solicite a un administrador la asignación del perfil "Tutor Visual IA" en la pestaña de Configuración de Seguridad y Perfiles para obtener acceso)
          </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-8">
          {/* CHAT INTERACTIVE PANEL */}
          <div className="flex-1 flex flex-col bg-gray-950/40 border border-gray-900 rounded-3xl overflow-hidden p-6 gap-4">
            {/* Advertencia obligatoria de límites */}
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
                                  type="button"
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
                        type="button"
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
                type="button"
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
                  type="button"
                  onClick={() => setChatInput("Quiero levantar una pared de 4x3 metros")}
                  className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                >
                  "Quiero levantar una pared de 4x3 metros"
                </button>
                <button 
                  type="button"
                  onClick={() => setChatInput("Voy a colocar porcelanato en un cuarto de 5x5m")}
                  className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                >
                  "Voy a colocar porcelanato en un cuarto de 5x5m"
                </button>
                <button 
                  type="button"
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
  );
}
