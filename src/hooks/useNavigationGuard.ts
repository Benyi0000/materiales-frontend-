import { useEffect, useRef } from "react";

interface UseNavigationGuardProps {
  /** Indica si hay cambios sin guardar que deben protegerse */
  isDirty: boolean;
  /** Función que se ejecuta cuando el escudo intercepta un intento de navegación */
  onIntercept: (target: HTMLElement) => void;
}

/**
 * Custom Hook para proteger la navegación (Dirty State Guard).
 * Intercepta recargas de página y clics internos (Sidebar, Links).
 */
export function useNavigationGuard({ isDirty, onIntercept }: UseNavigationGuardProps) {
  const bypassInterceptorRef = useRef(false);

  useEffect(() => {
    // 1. Protección contra cierre de pestaña o F5 (Nativo)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Tienes cambios sin guardar. ¿Estás seguro de querer salir?";
        return e.returnValue;
      }
    };

    // 2. Protección contra clics en la aplicación (React Router / Next.js SPA)
    const handleNavigationClick = (e: MouseEvent) => {
      if (bypassInterceptorRef.current) return; // Permitir el clic si estamos forzando la navegación

      const target = e.target as HTMLElement;
      
      // Verificar si el clic viene del menú lateral (aside) o de un enlace
      const isSidebarClick = target.closest('aside');
      const isLink = target.closest('a');
      
      const shouldIntercept = (isSidebarClick) || (isLink && !isLink.getAttribute('href')?.startsWith('#'));

      if (shouldIntercept && isDirty) {
        e.preventDefault();
        e.stopPropagation();
        onIntercept(target);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    // capture: true es crucial para interceptar antes de los manejadores de React
    document.addEventListener("click", handleNavigationClick, { capture: true });
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleNavigationClick, { capture: true });
    };
  }, [isDirty, onIntercept]);

  /**
   * Ejecuta el clic programáticamente esquivando el interceptor para permitir la navegación.
   */
  const bypassAndNavigate = (target: HTMLElement) => {
    bypassInterceptorRef.current = true;
    target.click();
    setTimeout(() => {
      bypassInterceptorRef.current = false;
    }, 100);
  };

  return { bypassAndNavigate };
}
