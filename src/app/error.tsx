'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <div className="bg-white border border-red-100 rounded-xl p-8 max-w-lg w-full shadow-sm">
        <h2 className="text-xl font-bold text-red-600 mb-2">Error en la aplicación</h2>
        <p className="text-sm text-gray-700 mb-4 font-mono bg-gray-50 p-3 rounded-lg break-all">
          {error?.message || 'Error desconocido'}
        </p>
        {error?.stack && (
          <pre className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg overflow-auto max-h-48 mb-4">
            {error.stack}
          </pre>
        )}
        <button
          onClick={reset}
          className="bg-[#E8612D] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d4551f]"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
