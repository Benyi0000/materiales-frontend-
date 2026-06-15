"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader, User as UserIcon, LogOut, Menu, Bot } from "lucide-react";

interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  assignments?: any[];
}

interface HeaderProps {
  currentUser: UserProfile | null;
  isPremium: boolean;
  apiOnline: boolean;
  loadingAPI: boolean;
  checkBackendAPI: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenTutor?: () => void;
}

export default function Header({
  currentUser,
  isPremium,
  apiOnline,
  loadingAPI,
  checkBackendAPI,
  onLogout,
  onToggleSidebar,
  onOpenTutor,
}: HeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      {/* Lado izquierdo: Hamburguesa + Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-[#6b7280] hover:text-[#E8612D] hover:bg-orange-50 transition-all"
          title="Menú"
        >
          <Menu size={22} />
        </button>

        <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2 shrink-0" title="Ir al inicio">
          <div className="bg-[#E8612D] p-1.5 rounded-lg text-white">
            <Building2 size={22} />
          </div>
          <span className="text-lg font-bold tracking-tight select-none text-[#1a1a2e]">
            Craft<span className="text-[#E8612D]">IAr</span>
          </span>
        </button>
      </div>

      {/* Lado derecho: Estado API + Usuario + Logout */}
      <div className="flex items-center gap-3">
        {/* Conexión API status */}
        <button 
          type="button"
          onClick={checkBackendAPI}
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            apiOnline 
              ? "bg-green-50 border-green-200 text-green-600" 
              : "bg-red-50 border-red-200 text-red-500"
          }`}
        >
          {loadingAPI ? (
            <Loader size={12} className="animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
          )}
          API: {apiOnline ? "ONLINE" : "CONECTANDO..."}
        </button>

        {isPremium && onOpenTutor && (
          <button
            type="button"
            onClick={onOpenTutor}
            className="hidden sm:flex items-center gap-2 px-2 py-2 text-sm font-medium text-[#E8612D] hover:text-[#d4551f] transition-colors"
          >
            <Bot size={16} />
            TutorIA
          </button>
        )}

        {currentUser && (
          <>
            <div className="flex items-center gap-2 px-2">
              <UserIcon size={16} className="text-[#E8612D]" />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#1a1a2e]">{currentUser?.first_name} {currentUser?.last_name}</p>
                <p className="text-[10px] text-[#6b7280]">@{currentUser?.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-[#6b7280] hover:text-red-500 transition-colors flex items-center justify-center"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
