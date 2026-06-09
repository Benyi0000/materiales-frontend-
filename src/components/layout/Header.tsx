import React from "react";
import { Building2, Loader, User as UserIcon, LogOut } from "lucide-react";

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
}

export default function Header({
  currentUser,
  isPremium,
  apiOnline,
  loadingAPI,
  checkBackendAPI,
  onLogout,
}: HeaderProps) {
  return (
    <header className="border-b border-[rgba(255,255,255,0.06)] bg-opacity-80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-amber-500 p-2 rounded-lg text-black animate-float">
          <Building2 size={24} />
        </div>
        <div className="text-left">
          <h1 className="text-xl font-bold tracking-tight">
            MATERIALES <span className="text-amber-500">INTELIGENTES</span>
          </h1>
          <p className="text-[10px] text-gray-500 tracking-wider">PORTAL DE MATERIALES Y CÁLCULO IA</p>
        </div>
      </div>

      {/* INFORMACIÓN DEL USUARIO LOGUEADO */}
      <div className="flex items-center gap-4">
        {/* Conexión API status */}
        <button 
          type="button"
          onClick={checkBackendAPI}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            apiOnline 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {loadingAPI ? (
            <Loader size={12} className="animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
          )}
          API Django: {apiOnline ? "ONLINE" : "CONECTANDO..."}
        </button>

        {currentUser && (
          <>
            <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] px-4 py-1.5 rounded-lg border border-[rgba(255,255,255,0.05)]">
              <UserIcon size={16} className="text-amber-500" />
              <div className="text-left">
                <p className="text-xs font-semibold">{currentUser?.first_name} {currentUser?.last_name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-gray-400">@{currentUser?.username}</p>
                  {isPremium && (
                    <span className="bg-amber-500/20 text-amber-500 text-[8px] font-bold px-1 rounded animate-pulse">PREMIUM</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center justify-center"
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
