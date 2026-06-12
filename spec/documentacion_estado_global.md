# Documentación Técnica: Estado Global y Persistencia de TutorIA

## 1. Objetivo
Implementar la persistencia de las sesiones de conversación del asistente de Inteligencia Artificial (TutorIA) en el frontend, garantizando que el usuario pueda navegar entre diferentes pestañas del Dashboard (por ejemplo, Catálogo, Logs de Auditoría, Perfiles) sin perder el progreso ni el contexto de su charla actual. 

## 2. Componentes y Arquitectura

### 2.1. `ChatContext.tsx`
Se creó un React Context global (`ChatProvider`) para administrar el ciclo de vida de la sesión del chat por encima de la renderización del Dashboard principal.
**Responsabilidades:**
- **`chatMessages`**: Almacena el historial local visual de la conversación, incluyendo los delimitadores de carga y los JSONs parseados de materiales (`materials`).
- **`sessionId`**: Mantiene el ID real de la sesión creada contra el backend Django RAG, esencial para que el streaming SSE (Server-Sent Events) conecte al mismo hilo de memoria vectorial.
- **`chatInput` y `isTyping`**: Mantienen en memoria global lo que el usuario estaba escribiendo o si el bot estaba procesando una respuesta.
- **`isWidgetOpen`**: Controla la visibilidad del widget de ventana emergente del chat flotante.

### 2.2. Interceptor de Navegación (`page.tsx`)
Se modificó el comportamiento del ruteo interno de las pestañas (`activeTab`).
**Lógica Implementada:**
- Cuando un usuario tiene una sesión activa (`hasActiveSession() === true`) e intenta cambiar de la pestaña **Tutor Visual IA** hacia otra (ej. Catálogo), el sistema lanza una Modal Global de tipo `custom_confirm`.
- **Botón "Seguir en otra pantalla"**: Minimiza el chat hacia la versión Widget Flotante inferior derecha (`isWidgetOpen = true`) y permite la navegación al catálogo.
- **Botón "Cerrar Sesión"**: Dispara `clearSession()`, limpia el contexto global y navega al catálogo libremente.
- **Efecto Inverso**: Si el usuario abre el chat desde el botón de atajo del Header (estando en otra pestaña), la sesión activa viaja al modo pantalla completa (Full View) cerrando el Widget.

### 2.3. Dualidad Visual (`TutorVisualChat.tsx`)
El componente base del chat se hizo agnóstico respecto al estado. Ahora consume puramente de `useChat()`.
- Soporta la propiedad `layoutMode="full" | "widget"`.
- Responde a diseños condicionales mediante Tailwind CSS, adaptando el tamaño de las burbujas, tipografías e iconografía si se encuentra embebido en una caja pequeña o ocupando la pantalla completa.
- **Actualización Visual**: Se limpiaron los títulos superpuestos (como "Online" y dobles "TutorIA") para resolver el defecto en el que colisionaba la cabecera administrada por Next.js en la Landing Page Pública y el Dashboard Interno.

### 2.4. Landing Pública (`PublicLanding.tsx`)
Se optimizó el widget del cliente estándar. 
- Se retiró la etiqueta redundante "Flotante" para dejar una marca más limpia: **"Tutor IA"**.
- El widget maneja sus propios estados visuales de apertura y cierre utilizando clases utilitarias de Tailwind.

## 3. Seguridad e Integridad
- **Aislamiento**: El `ChatProvider` engloba únicamente al `DashboardInner`, de manera que si el usuario realiza un Log Out, el árbol completo de componentes se destruye, garantizando que el historial de una sesión no pueda filtrarse al iniciar sesión en el mismo navegador con un usuario distinto.
- **Gestión de Carga**: Se evitan dobles llamadas innecesarias al endpoint POST `/chatbot/chat/` en RAG validando `if (!isPremium || sessionId) return;` en el `useEffect` de inicialización.
