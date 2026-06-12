"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  materials?: any[];
}

interface ChatContextType {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sessionId: string | null;
  setSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  creatingSession: boolean;
  setCreatingSession: React.Dispatch<React.SetStateAction<boolean>>;
  clearSession: () => void;
  hasActiveSession: () => boolean;
  isWidgetOpen: boolean;
  setIsWidgetOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultMessages: ChatMessage[] = [
  {
    sender: "ai",
    text: "¡Hola! Soy tu Tutor Visual. Cuéntame qué proyecto tienes en mente (ej. 'levantar una pared de 4x3m' o 'pintar un cuarto') y calcularé los materiales exactos que necesitas para tu carrito.",
    materials: []
  },
  {
    sender: "ai",
    text: "⚠️ Advertencia: Los cálculos provistos son estimaciones basadas en fórmulas generales de construcción y no reemplazan el criterio certificado de un profesional o ingeniero.",
    materials: []
  }
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultMessages);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  const clearSession = () => {
    setChatMessages(defaultMessages);
    setSessionId(null);
    setChatInput("");
    setIsTyping(false);
  };

  const hasActiveSession = () => {
    return chatMessages.length > defaultMessages.length;
  };

  return (
    <ChatContext.Provider value={{
      chatMessages, setChatMessages,
      sessionId, setSessionId,
      chatInput, setChatInput,
      isTyping, setIsTyping,
      creatingSession, setCreatingSession,
      clearSession, hasActiveSession,
      isWidgetOpen, setIsWidgetOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
