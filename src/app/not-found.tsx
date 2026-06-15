import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        {/* Ícono */}
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <SearchX className="w-12 h-12 text-[#E8612D]" />
        </div>

        {/* Código */}
        <p className="text-8xl font-black text-[#E8612D] leading-none mb-4 tracking-tight">
          404
        </p>

        {/* Título */}
        <h1 className="text-2xl font-black text-[#1a1a2e] mb-3 tracking-tight">
          Página no encontrada
        </h1>

        {/* Descripción */}
        <p className="text-gray-500 text-base mb-10 leading-relaxed">
          La URL que ingresaste no existe o fue movida.
          <br />
          Verificá que el enlace esté escrito correctamente.
        </p>

        {/* Botón ir al inicio */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#E8612D] hover:bg-[#d4551f] text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
        >
          <Home className="w-5 h-5" />
          Ir al inicio
        </Link>

      </div>
    </div>
  );
}
