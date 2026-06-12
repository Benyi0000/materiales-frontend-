import React, { useEffect, useRef, useState } from "react";
import { Bot, Lock, HelpCircle, Sparkles, Plus, Loader, Send, X, MessageSquare } from "lucide-react";
import { useChat } from "./ChatContext";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  description: string;
  category_name: string;
  image_url: string;
  stock: number;
  weight_kg?: number;
}

interface TutorVisualChatProps {
  products: Product[];
  addToCart: (product: Product, quantity?: number) => void;
  isPremium: boolean;
  apiBaseUrl: string;
  isAdmin: boolean;
  googleApiKeyConfigured: boolean;
  layoutMode?: "full" | "widget";
}

export default function TutorVisualChat({ 
  products, 
  addToCart, 
  isPremium, 
  apiBaseUrl,
  isAdmin,
  googleApiKeyConfigured,
  layoutMode = "widget"
}: TutorVisualChatProps) {
  const {
    chatMessages, setChatMessages,
    sessionId, setSessionId,
    chatInput, setChatInput,
    isTyping, setIsTyping,
    isWidgetOpen, setIsWidgetOpen
  } = useChat();
  const [creatingSession, setCreatingSession] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll hacia el final cuando hay nuevos mensajes o el bot está escribiendo
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Inicializar o recuperar sesión de chat en el backend al ingresar si es premium
  useEffect(() => {
    if (!isPremium || sessionId) return;

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
  }, [isPremium, apiBaseUrl, sessionId, setCreatingSession, setSessionId, setChatMessages]);

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
    <div className={`flex-1 flex flex-col text-left h-full ${isAdmin && layoutMode === 'full' ? 'gap-4' : ''}`}>
      {isAdmin && layoutMode === 'full' && (
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="text-[#E8612D]" />
            <span>Tutor Visual IA</span>
          </h2>
          <p className="text-xs text-[#6b7280]">Asistente avanzado conectado a RAG, cálculo de insumos y guías de obra.</p>
        </div>
      )}

      {isAdmin && !googleApiKeyConfigured && layoutMode === 'full' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex flex-col gap-2 shadow-sm max-w-4xl">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            <span className="font-bold text-xs uppercase tracking-wider">Establecer clave API KEY (Administrador)</span>
          </div>
          <p className="text-[11px] text-[#6b7280]">
            La clave de Google Gemini (<code>GOOGLE_API_KEY</code>) no está configurada en el servidor.
            Por favor, agrégala en el archivo <code>.env</code> de tu servidor para activar el Tutor Visual IA.
          </p>
        </div>
      )}

      {!isPremium ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-[#E8612D]/15 bg-[#fff7ed] rounded-xl max-w-2xl mx-auto my-8 gap-4">
          <div className="bg-[#fff7ed] p-4 rounded-full text-[#E8612D] border border-[#E8612D]/20">
            <Lock size={36} />
          </div>
          <h3 className="text-lg font-bold text-[#1a1a2e]">Módulo Exclusivo para Usuarios Premium</h3>
          <p className="text-sm text-[#6b7280] max-w-md">
            El Tutor Visual IA realiza búsquedas semánticas y ejecuta cálculos matemáticos de dosificación según tus medidas para sugerir los materiales precisos del catálogo.
          </p>
          <p className="text-xs text-[#9ca3af] italic mt-2">
            (Solicite a un administrador la asignación del perfil "Tutor Visual IA" en la pestaña de Configuración de Seguridad y Perfiles para obtener acceso)
          </p>
        </div>
      ) : (
        <div className="flex-grow flex gap-8 items-stretch h-full">
          {/* CHAT INTERACTIVE PANEL */}
          <div className={`flex-1 flex flex-col bg-white overflow-hidden flex-grow gap-4 ${isAdmin && layoutMode === 'full' ? 'border border-[#e5e7eb] rounded-xl p-6 shadow-sm min-h-[450px]' : 'p-4'}`}>

            {creatingSession ? (
              <div className="flex-grow flex flex-col items-center justify-center gap-2 text-[#6b7280] text-xs">
                <Loader size={24} className="animate-spin text-[#E8612D]" />
                <span>Iniciando sesión del asistente RAG...</span>
              </div>
            ) : (
              <>
                {/* Spacer superior removido para mantener la caja de texto estática en la base */}

                {/* Ventana de Conversación */}
                <div 
                  ref={scrollContainerRef}
                  className={`flex-grow overflow-y-auto pr-2 flex flex-col ${layoutMode === 'full' ? 'py-4' : ''}`}
                >
                  <div className={`flex flex-col gap-4 w-full ${layoutMode === 'full' ? 'max-w-3xl mx-auto' : ''}`}>
                    {chatMessages.map((msg, idx) => {
                      const isUser = msg.sender === "user";
                      const isFull = layoutMode === "full";

                      const bubbleClasses = isUser
                        ? `self-end ${isFull ? 'bg-[#fff7ed] border border-[#E8612D]/20 text-[#1a1a2e] px-5 py-3 rounded-3xl text-[15px] max-w-[70%]' : 'bg-gray-100 text-[#1a1a2e] p-4 rounded-xl max-w-[85%] text-xs'}`
                        : `self-start text-[#1a1a2e] ${isFull ? 'bg-transparent text-[15px] w-full' : 'bg-[#fff7ed] border border-[#E8612D]/20 p-4 rounded-xl max-w-[85%] text-xs'}`;

                      return (
                        <div key={idx} className={bubbleClasses}>
                          {isFull && !isUser ? (
                            <div className="flex gap-4 items-start">
                              <div className="p-1.5 bg-[#E8612D]/10 rounded-full mt-0.5 shrink-0">
                                <Sparkles size={18} className="text-[#E8612D]" />
                              </div>
                              <div className="flex-1 space-y-3">
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                {/* Listado de Materiales Sugeridos */}
                                {msg.materials && msg.materials.length > 0 && (
                                  <div className="border-t border-[#e5e7eb] pt-4 mt-4 flex flex-col gap-3">
                                    <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                                      Materiales Recomendados:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {msg.materials.map((mat: any, mIdx: number) => {
                                        const prod = products.find(p => p.sku === mat.sku);
                                        return (
                                          <div key={mIdx} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:border-[#E8612D]/50 transition-colors">
                                            <div className="text-left overflow-hidden">
                                              <p className="text-sm font-semibold text-[#1a1a2e] truncate">{prod ? prod.name : mat.sku}</p>
                                              <p className="text-xs text-[#6b7280] truncate">{mat.desc}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                              <span className="bg-gray-100 text-gray-700 font-bold text-xs px-2 py-1 rounded-md">
                                                x{mat.qty}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => prod && addToCart(prod, mat.qty)}
                                                className="bg-[#E8612D] text-white p-1.5 rounded-lg hover:bg-[#d4551f] transition-all"
                                              >
                                                <Plus size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCalculatedMaterialsToCart(msg.materials || [])}
                                      className="w-auto self-start mt-1 bg-white hover:bg-gray-50 text-[#1a1a2e] border border-gray-300 text-xs font-semibold py-2 px-4 rounded-full transition-all"
                                    >
                                      Agregar todo al carrito
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={`${isFull ? 'leading-relaxed' : 'text-xs leading-relaxed'} whitespace-pre-wrap`}>{msg.text}</p>
                              
                              {/* Listado de Materiales Sugeridos (Modo Widget) */}
                              {msg.materials && msg.materials.length > 0 && !isFull && (
                                <div className="border-t border-[#E8612D]/15 pt-3 mt-3 flex flex-col gap-2">
                                  <p className="text-[10px] font-bold text-[#E8612D] uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles size={12} />
                                    <span>Materiales Detectados:</span>
                                  </p>
                                  <div className="flex flex-col gap-1.5">
                                    {msg.materials.map((mat: any, mIdx: number) => {
                                      const prod = products.find(p => p.sku === mat.sku);
                                      return (
                                        <div key={mIdx} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-[#e5e7eb]">
                                          <div className="text-left">
                                            <p className="text-xs font-semibold text-[#1a1a2e]">{prod ? prod.name : mat.sku}</p>
                                            <p className="text-[10px] text-[#6b7280] mt-0.5">{mat.desc}</p>
                                          </div>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="bg-[#fff7ed] text-[#E8612D] font-bold text-xs px-2 py-0.5 rounded">
                                              Cant: {mat.qty}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => prod && addToCart(prod, mat.qty)}
                                              className="bg-[#E8612D] text-white p-1 rounded hover:bg-[#d4551f] transition-all"
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
                                    onClick={() => addCalculatedMaterialsToCart(msg.materials || [])}
                                    className="w-full mt-2 bg-[#E8612D]/10 hover:bg-[#E8612D]/20 text-[#E8612D] border border-[#E8612D]/30 text-[11px] font-bold py-2 rounded-lg transition-all"
                                  >
                                    Agregar Todos
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className={`self-start flex items-center gap-2 ${layoutMode === 'full' ? 'ml-12 p-2' : 'bg-[#fff7ed] border border-[#E8612D]/20 rounded-xl p-4'}`}>
                        <span className="w-2 h-2 bg-[#E8612D] rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-[#E8612D] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-[#E8612D] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Input de Mensaje */}
                <div className={`${layoutMode === 'full' ? 'w-full max-w-3xl mx-auto pt-2 pb-6' : 'border-t border-[#e5e7eb] pt-4 mt-auto'} shrink-0`}>
                  <div className={`flex gap-2 ${layoutMode === 'full' ? 'bg-gray-100/80 border border-gray-200 rounded-full p-2 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 ring-gray-300 transition-all' : ''}`}>
                    <input 
                      type="text" 
                      placeholder="Escribe tu consulta aquí..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className={`flex-grow outline-none text-[#1a1a2e] placeholder-gray-500 transition-all ${layoutMode === 'full' ? 'bg-transparent px-4 text-[15px]' : 'bg-gray-50 border border-[#e5e7eb] rounded-xl px-4 py-3 text-xs focus:border-[#E8612D]/40'}`}
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className={`${layoutMode === 'full' ? 'bg-[#E8612D] hover:bg-[#d4551f] text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all' : 'bg-[#E8612D] hover:bg-[#d4551f] text-white px-4 py-3 rounded-xl text-xs font-bold transition-all'}`}
                    >
                      {layoutMode === 'full' ? <Send size={18} /> : 'Consultar'}
                    </button>
                  </div>
                </div>

                {/* Spacer inferior removido */}
              </>
            )}
          </div>

          {/* SIDEBAR CON EJEMPLOS Y GUÍAS DE USO (SOLO ADMIN) */}
          {isAdmin && layoutMode === 'full' && (
            <div className="w-72 flex flex-col gap-6 shrink-0">
              <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl text-left shadow-sm">
                <h4 className="text-sm font-bold text-[#1a1a2e] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#E8612D]" />
                  <span>Consultas RAG de prueba</span>
                </h4>
                <p className="text-[10px] text-[#6b7280] mt-1">Sugerencias para enviar al asistente:</p>
                
                <div className="flex flex-col gap-2 mt-4">
                  <button 
                    type="button"
                    onClick={() => setChatInput("Necesito materiales para una pared de ladrillos huecos de 10m²")}
                    className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] p-2.5 rounded-xl text-left text-xs text-[#6b7280] transition-all"
                  >
                    1. Cálculo de Muros (10m²)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setChatInput("Voy a colocar porcelanato en un piso de 4x5 metros. ¿Qué necesito?")}
                    className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] p-2.5 rounded-xl text-left text-xs text-[#6b7280] transition-all"
                  >
                    2. Dosificación de Pisos (20m²)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setChatInput("Recomiéndame una buena pintura para exteriores que resista la humedad.")}
                    className="bg-gray-50 hover:bg-gray-100 border border-[#e5e7eb] p-2.5 rounded-xl text-left text-xs text-[#6b7280] transition-all"
                  >
                    3. Búsqueda Semántica de Pinturas
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#e5e7eb] p-5 rounded-xl text-left shadow-sm">
                <h4 className="text-sm font-bold text-[#1a1a2e] flex items-center gap-2">
                  <HelpCircle size={16} className="text-blue-600" />
                  <span>Guía de Respuestas Visuales</span>
                </h4>
                <p className="text-[10px] text-[#6b7280] mt-2 leading-relaxed">
                  El LLM responde con el texto de la sugerencia en formato markdown. El frontend <strong>escanea</strong> la respuesta y detecta automáticamente los <strong>SKU de los productos</strong> que se hayan mencionado para generar los botones visuales de "Agregar al carrito".
                </p>
                <div className="mt-4 p-3 bg-[#fff7ed] border border-[#E8612D]/20 rounded-lg">
                  <p className="text-[10px] text-[#E8612D] font-mono">Modelo: Gemini 1.5 Flash<br/>Chunking: LangchainRecursive<br/>Embeddings: text-embedding-004</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
