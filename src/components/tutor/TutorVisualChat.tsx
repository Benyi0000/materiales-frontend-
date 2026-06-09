import React, { useState, useEffect } from "react";
import { Bot, Lock, HelpCircle, Sparkles, Plus, Loader } from "lucide-react";

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
  apiBaseUrl: string;
  isAdmin: boolean;
  googleApiKeyConfigured: boolean;
}

export default function TutorVisualChat({ 
  products, 
  addToCart, 
  isPremium, 
  apiBaseUrl,
  isAdmin,
  googleApiKeyConfigured
}: TutorVisualChatProps) {
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "¡Hola! Soy tu Tutor Visual de Construcción. Escríbeme qué proyecto tienes en mente (ej. 'Quiero levantar una pared de 4x3 metros' o 'Voy a colocar porcelanato en un cuarto de 5x5m') y te daré una guía de instalación paso a paso, calculando los materiales necesarios que podrás agregar a tu carrito de compras.",
      materials: []
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  // Inicializar o recuperar sesión de chat en el backend al ingresar si es premium
  useEffect(() => {
    if (!isPremium) return;

    const initChatSession = async () => {
      setCreatingSession(true);
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        // Intentar crear una nueva sesión de chat en el backend
        const res = await fetch(`${apiBaseUrl}/chatbot/chat/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.id);
          // Si la sesión creada ya tiene mensajes previos (historial), cargarlos
          if (data.messages && data.messages.length > 0) {
            const formattedHistory = data.messages.map((m: any) => ({
              sender: m.role === "user" ? "user" : "ai",
              text: m.content,
              materials: [] // El RAG responde en texto
            }));
            setChatMessages(formattedHistory);
          }
        }
      } catch (err) {
        console.error("Error al iniciar sesión de chat en RAG:", err);
      } finally {
        setCreatingSession(false);
      }
    };

    initChatSession();
  }, [isPremium, apiBaseUrl]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !sessionId) return;
    
    const userMsg = chatInput;
    // Agregar el mensaje del usuario al estado local
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsTyping(false);
      return;
    }

    try {
      // Llamada real al endpoint de streaming SSE del RAG
      const res = await fetch(`${apiBaseUrl}/chatbot/chat/${sessionId}/stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!res.ok) {
        let errMsg = "Error desconocido.";
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.detail || JSON.stringify(errData);
        } catch (e) {
          try {
            const textMsg = await res.text();
            if (textMsg) {
              errMsg = textMsg.length > 200 ? textMsg.substring(0, 200) + "..." : textMsg;
            }
          } catch (textErr) {
            errMsg = "No se pudo leer el cuerpo de la respuesta.";
          }
        }
        setChatMessages(prev => [...prev, { 
          sender: "ai", 
          text: `Error al conectar con el asistente de IA: ${errMsg}` 
        }]);
        setIsTyping(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) {
        setIsTyping(false);
        return;
      }

      // Quitar loader e insertar burbuja vacía de la IA que se irá completando
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: "ai", text: "", materials: [] }]);

      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        // Dividir los chunks por el delimitador estándar de SSE
        const lines = chunkText.split("\n");

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith("data: ")) {
            const dataStr = trimmedLine.slice(6).trim();
            if (dataStr === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.response) {
                accumulatedText += parsed.response;
                // Actualizar reactivamente el último mensaje del chat (la respuesta de la IA)
                setChatMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0) {
                    // Buscar los SKUs que se mencionan en la respuesta de forma dinámica
                    const matchedMaterials = parseMaterialsFromText(accumulatedText);
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      text: accumulatedText,
                      materials: matchedMaterials
                    };
                  }
                  return updated;
                });
              }
            } catch (err) {
              // Ignorar errores de parses incompletos de chunks
            }
          }
        }
      }
    } catch (err) {
      console.error("Error al transmitir respuesta de IA:", err);
      setChatMessages(prev => [...prev, { 
        sender: "ai", 
        text: "Error de red al intentar conectar con el Tutor Visual IA." 
      }]);
      setIsTyping(false);
    }
  };

  // Función inteligente para mapear SKUs y cantidades sugeridas a partir del texto generado por Gemini
  const parseMaterialsFromText = (text: string): { sku: string; qty: number; desc: string }[] => {
    const matched: { sku: string; qty: number; desc: string }[] = [];
    
    // Buscar patrones de materiales en base a los SKUs disponibles
    products.forEach(p => {
      // Expresión regular insensible a mayúsculas para buscar el SKU en el texto
      const regex = new RegExp(`(${p.sku})`, "gi");
      if (regex.test(text)) {
        // Intentar inferir cantidad (ej: busca un número cercano al SKU o por defecto asume 1)
        let qty = 1;
        // Búsqueda simple de cantidad
        const sentences = text.split(/[.\n]/);
        const matchSentence = sentences.find(s => s.toLowerCase().includes(p.sku.toLowerCase()));
        if (matchSentence) {
          const numMatch = matchSentence.match(/(\d+)\s*(unidades|bolsas|metros|placas|ladrillos|u)?/i);
          if (numMatch) {
            qty = parseInt(numMatch[1], 10);
          }
        }
        
        if (!matched.some(m => m.sku === p.sku)) {
          matched.push({
            sku: p.sku,
            qty: qty,
            desc: `Sugerido por IA: ${p.name}`
          });
        }
      }
    });
    
    return matched;
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
    alert(`Se agregaron ${count} materiales sugeridos al carrito.`);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 text-left">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="text-amber-500" />
          <span>Tutor Visual IA</span>
        </h2>
        <p className="text-xs text-gray-400">Asistente avanzado conectado a RAG, cálculo de insumos y guías de obra.</p>
      </div>

      {isAdmin && !googleApiKeyConfigured && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl p-4 flex flex-col gap-2 shadow-lg max-w-4xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            <span className="font-bold text-xs uppercase tracking-wider">Establecer clave API KEY (Administrador)</span>
          </div>
          <p className="text-[11px] text-gray-300">
            La clave de Google Gemini (<code>GOOGLE_API_KEY</code>) no está configurada en el servidor.
            Por favor, agrégala en el archivo <code>.env</code> de tu servidor para activar el Tutor Visual IA.
          </p>
        </div>
      )}

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
        <div className="flex-grow flex gap-8 items-stretch">
          {/* CHAT INTERACTIVE PANEL */}
          <div className="flex-1 flex flex-col bg-gray-950/40 border border-gray-900 rounded-3xl overflow-hidden p-6 gap-4 min-h-[450px]">
            {/* Advertencia obligatoria de límites */}
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl p-3 text-[11px] flex gap-2">
              <HelpCircle size={16} className="shrink-0" />
              <p>
                <strong>Advertencia:</strong> Los cálculos provistos por el Tutor Visual son estimaciones basadas en fórmulas generales de construcción y no reemplazan el criterio certificado de un profesional o ingeniero.
              </p>
            </div>

            {creatingSession ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-2 text-gray-400 text-xs">
                <Loader size={24} className="animate-spin text-amber-500" />
                <span>Iniciando sesión del asistente RAG...</span>
              </div>
            ) : (
              <>
                {/* Ventana de Conversación */}
                <div className="flex-grow overflow-y-auto pr-2 flex flex-col gap-4 max-h-[380px]">
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
                            <span>Materiales Detectados en Respuesta:</span>
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
                    placeholder="Pregúntale a tu RAG... Ej: Necesito materiales para levantar una pared de 4x3 metros"
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
                    Consultar RAG
                  </button>
                </div>
              </>
            )}
          </div>

          {/* SIDEBAR CON EJEMPLOS Y GUÍAS DE USO */}
          <div className="w-72 flex flex-col gap-6">
            <div className="bg-gray-950/20 border border-gray-900 p-5 rounded-3xl text-left">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Consultas RAG de prueba</span>
              </h4>
              <p className="text-[10px] text-gray-400 mt-1">Sugerencias para enviar al asistente:</p>
              
              <div className="flex flex-col gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => setChatInput("Necesito materiales para una pared de ladrillos huecos de 10m²")}
                  className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                >
                  "Pared de ladrillos huecos (10m²)"
                </button>
                <button 
                  type="button"
                  onClick={() => setChatInput("¿Cómo coloco porcelanato en una habitación de 5x5 metros?")}
                  className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                >
                  "Colocar porcelanato en cuarto (5x5m)"
                </button>
                <button 
                  type="button"
                  onClick={() => setChatInput("¿Qué es un tabique de durlock y qué insumos lleva?")}
                  className="bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800 p-2.5 rounded-xl text-left text-xs text-gray-300 transition-all"
                >
                  "Tabique de Durlock e Insumos"
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
