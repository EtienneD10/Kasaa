# Kasaa — Spec de Producto y Diseño

Documento de referencia central para desarrollo. Consolida todas las decisiones de diseño, arquitectura de información y reglas de negocio definidas durante el proceso de diseño en Figma.

---

## 1. Identidad y sistema de diseño

### 1.1 Marca
- **Nombre**: Kasaa
- **Wordmark**: `kasaa` — todo minúscula, bold, sin ícono/badge acompañante. Fuente Inter.
- Existen **dos superficies visuales distintas** dentro del mismo producto:
  - **App compradora**: light mode editorial (fondo claro, bordes finos, mucho whitespace)
  - **Panel de agente**: dark utility (sidebar oscuro, contenido denso, orientado a productividad)

### 1.2 Paleta — App compradora (light editorial)
| Token | Valor | Uso |
|---|---|---|
| Fondo general | `#FAFAFA` | Background de página |
| Fondo de tarjetas | `#FFFFFF` | Cards, paneles, modales |
| Borde estándar | `#E5E5E5` (1px) | Todos los bordes de card/input |
| Texto primario | `#1A1A1A` | Títulos, precios, texto principal |
| Texto secundario | `#6B7280` / `#9CA3AF` | Specs, labels, metadata |
| Acento único | `#00FF66` (neon green) | CTAs primarios, estados activos, favoritos marcados |
| Tinte de selección | `#F0FFF6` | Fondo de chip/día seleccionado |
| **Regla estricta**: nunca usar rojo en la app compradora. El corazón de favoritos nunca es rojo, siempre verde neón cuando está activo. |

### 1.3 Paleta — Panel de agente (dark utility)
Sistema semántico de 4 colores permitido (a diferencia de la app compradora):
| Color | Hex | Significado |
|---|---|---|
| Verde | `#00FF66` | Éxito / activo / confirmado |
| Ámbar | `#F59E0B` (bg `#FEF3C7`) | Pendiente / atención |
| Rojo | `#EF4444` (bg `#FEE2E2`) | Urgente / vencido / cancelado |
| Azul | `#3B82F6` (bg `#DBEAFE`) | Informativo / nuevo |
- Sidebar: `#0F1210`, fixed, 260px
- Fondo de contenido: `#FAFAFA`, cards blancas con borde `#E5E5E5`

### 1.4 Tipografía
- **App compradora**: serif editorial (Fraunces/Playfair) para títulos grandes de sección + Inter para todo lo demás (UI, precios, botones)
- **Panel de agente**: Inter en todo, sin serif — es una herramienta de trabajo, no una superficie de consumo

### 1.5 Componentes base reutilizados en todo el sistema
- **Chip de día/hora**: selector reutilizado en booking (comprador), Agenda (agente), reagendado, resolución de conflictos, Marketing (programar publicación)
- **Botón primario**: fill `#00FF66`, texto negro bold, radius 12px
- **Botón outline**: 1px border, fondo transparente/blanco
- **Popover de confirmación ligero** (para cancelar): "¿Estás seguro?" + dos botones, patrón reutilizado en cancelar visita, eliminar propiedad, etc.
- **Toggle switch**: pill 44x24px, gris apagado / verde neón activo

---

## 2. Arquitectura de cuentas y roles

- **Una sola cuenta** por persona, con campo de rol: `comprador` o `agente`.
- El rol se define en el registro (dos flujos de signup distintos, bifurcados desde la pantalla de login).
- **Un agente puede navegar y agendar libremente como comprador** (sin restricción inversa).
- **Un comprador nunca puede acceder al panel de agente** (`/agente/*`).

### Reglas de enrutamiento del header
| Estado | Header muestra | Click en "Anunciar propiedad" / equivalente |
|---|---|---|
| No autenticado | "Iniciar sesión" + botón outline "Anunciar propiedad" | → Login de agente |
| Comprador logueado | Campanita + ícono Visitas (badge) + avatar. **No muestra "Anunciar propiedad"** | — |
| Agente logueado | Botón lleno verde "Panel de agente →" + avatar | → Dashboard directo |

- Acceso directo por URL a `/agente/*` sin rol de agente → pantalla **"Acceso restringido"** (dark, con CTA "Registrarme como agente").

---

## 3. App compradora — Inventario de pantallas

### 3.1 Landing Gateway
Mosaico de video en vivo de fondo (grid de propiedades reproduciéndose, dimmed), headline editorial centrado, botones "Comprar" / "Alquilar" (llevan a Discovery con filtro de operación pre-aplicado, sin login requerido), link "o explorá todas las propiedades".

### 3.2 Login / Registro (comprador)
Split screen desktop: video de propiedad a la izquierda, formulario a la derecha. Tabs Login/Signup. Social login. Footer con link a registro de agente.

### 3.3 Discovery (pantalla principal)
- Header + Filter bar (chips rápidos + botón Filtros avanzados con badge contador)
- Toggle Grid/Mapa
- **Contenido organizado en secciones temáticas** (no un solo grid continuo): "Propiedades destacadas", "Recién publicadas", "Cerca de tu última búsqueda" — cada una con título, subtítulo, 8 tarjetas, y 64px de espaciado antes/después
- **Tarjeta destacada/interstitial**: formato horizontal 21:9, video full-bleed, badge "DESTACADO", insertada entre secciones (máx. 1 cada 2 secciones)
- Paginación: auto-carga las primeras 3 secciones, después botón explícito "Ver más propiedades" (no infinite scroll puro)
- Vista Mapa: split screen (lista + mapa interactivo), pines con clustering, preview flotante al click
- Estado vacío: dos variantes (filtros muy restrictivos con chips removibles / zona sin cobertura)
- Búsqueda IA: mismo Discovery con barra de query editable + chips de interpretación IA read-only

### 3.4 Tarjeta de propiedad (componente maestro)
- Media canvas full-bleed (foto → crossfade a video en hover/viewport)
- Overlays sobre el video: badges (EN VENTA/ALQUILER, 3D Tour, timestamp), íconos de acción (galería, mute, IA sparkle), ubicación+título, specs bar, precio grande, agente+favoritos
- Footer blanco: tira de disponibilidad (chips de día) + botones "Ver en 3D" / "Agendar Visita"
- **Estado expandido inline**: al click en "Agendar Visita", la tarjeta crece in-place (no modal) mostrando selector de día → hora → confirmación agente → botón "Solicitar Visita" (ver §5 Reglas de negocio — ya no confirma instantáneo)
- Características esenciales (ver §3.7) visibles en Quick Look, no en la tarjeta de grid (por espacio)

### 3.5 Vista ampliada — Quick Look Modal
Overlay sobre Discovery (no navega afuera). Video/fotos con toggle, controles reales. Summary con specs, precio, agente. Sección "Características" (grid de datos esenciales). Sección "Financiamiento" (si aplica). "También te puede interesar" (scroll horizontal). Mini-mapa de ubicación. Botón "Ver visita inmersiva completa" → pasa al Feed inmersivo.

### 3.6 Feed inmersivo
Video vertical 9:16, swipe continuo. **Cola de similares estilo Netflix** (mismo área, precio, tipo — no el orden crudo del grid), generada dinámicamente al entrar. Overlays idénticos a la tarjeta. Panel de booking se expande hacia arriba desde abajo (no modal separado). Botón "Volver a resultados" mantiene posición de scroll de Discovery.

### 3.7 Características y financiamiento (campos de propiedad)
Campos obligatorios que el agente debe cargar: antigüedad, orientación, piso+ascensor, expensas, disposición, cochera, superficie cubierta/descubierta, estado de conservación. Financiamiento: toggle "Apto crédito bancario" (+ bancos participantes opcional) y toggle "Es un desarrollo" (revela anticipo, cuotas, plazo de entrega, ajuste).

### 3.8 Filtros avanzados (panel/drawer)
Secciones: Básicos (precio, ambientes, m²) · Estilo de vida (pet-friendly, cerca de colegios, etc.) · **Características esenciales** (antigüedad, orientación, piso, expensas, disposición, cochera, estado) · **Financiamiento** (apto crédito / financiación desarrollista) · Búsqueda IA (prompt libre + tags sugeridos).

### 3.9 Flujo de agenda / booking
Ver §5 — regla central: **toda solicitud pasa a estado "Pendiente" y notifica al agente por WhatsApp**, no se confirma instantáneamente.

### 3.10 Mis Visitas
Accedido desde header (ícono calendario con badge) o dropdown de avatar. 3 tabs: Pendientes / Aceptadas / Canceladas. Reagendar (muestra fecha actual + nuevo selector, vuelve a Pendiente). Cancelar (popover de confirmación, no requiere aprobación del agente).

### 3.11 Dropdown de cuenta (click en avatar)
Mi cuenta · Mis Visitas (badge) · **Favoritos** (grid filtrado, reutiliza componente de Discovery) · Búsquedas guardadas · Configuración · Cerrar sesión.

### 3.12 Drawer de Configuración
Se abre desde el borde derecho (anclado al avatar, mismo punto de origen que el dropdown, transición coherente entre ambos). Tabs: Datos personales · Notificaciones (por canal: WhatsApp/Email/Push) · Búsquedas guardadas · Privacidad.

### 3.13 Perfil del agente inmobiliario
Página completa: header con avatar, stats (propiedades, rating, tiempo de respuesta), grid de sus propiedades activas, bio/especialidades.

### 3.14 Centro de notificaciones
Dropdown desde campanita del header. Lista con ícono por tipo, texto, timestamp. Click navega al contexto relevante.

---

## 4. Panel de agente — Inventario de pantallas

### 4.1 Login de agente
Card centrada sobre fondo dark `#0F1210`. Distinto del login comprador (utility, no marketing).

### 4.2 Dashboard Home
- Saludo + fecha + resumen del día
- 4 stat cards (Propiedades activas, Visitas del mes con desglose confirmadas/pendientes/canceladas, Leads activos, Tasa de respuesta con tooltip explicando la regla de 2hs)
- **"Atención Requerida"**: tarjetas de alerta accionables (publicaciones que necesitan confirmar vigencia, visita sin confirmar, propiedad sin fotos, **visita a punto de vencer** — ordenadas por urgencia, la de "por vencer" con animación de pulso)
- Catálogo Activo (grid compacto) + Timeline del Día (con accept/reject inline para pendientes)
- Toggle Admin: "Mi actividad" / "Todo el equipo" (solo visible para rol Administrador)

### 4.3 Propiedades (tabla + editor)
- **Tabla**: checkboxes de selección + acciones en lote, columnas (código, foto, propiedad/dirección, tipo, estado, precio, vistas, visitas, actualizada, acciones), toggle Publicar inline, paginación, placeholder "Sin fotos"
- **Código único por propiedad**: formato `PREFIJO-0000`, prefijo configurable por agencia en Configuración, auto-generado, editable manualmente si hace falta, buscable
- **Editor** (tabs, no wizard lineal): Información básica · Detalles (incluye características esenciales) · Media (fotos/video, reorder) · Disponibilidad (reutiliza chip selector) · **Financiamiento** (toggles crédito bancario / desarrollo) · Vista previa (preview real del card)
- **Regla de auto-pausa a 20 días**: propiedad sin actualizar 20+ días → estado "Pendiente de confirmación" (amber) → modal "¿Sigue disponible?" con Sí/No/Recordarme en 3 días

### 4.4 Agenda (calendario)
- Vista semana/mes, filtros por propiedad/estado, bloqueo de horarios
- Bloques coloreados por estado semántico, tooltip enriquecido (foto, cliente completo, WhatsApp directo)
- **Detección de conflictos**: dos solicitudes mismo horario → flag visual + modal de resolución en 3 pasos:
  1. Elegir a quién confirmar
  2. Reagendar al desplazado (selector día/hora + preview de mensaje)
  3. Enviar propuesta por WhatsApp → estado "Esperando respuesta" → agente marca manualmente "Confirmó" / "Rechazó" (recordatorio a las 24hs si no hay respuesta)
- **Timer de 2 horas** visible en cada bloque/tooltip/panel pendiente (ver §5)

### 4.5 Pipeline (Kanban de leads)
6 columnas: Nuevo Lead → Contactado → Visita Agendada → Visita Realizada → Negociación → Cerrado (Ganado/Perdido). Tarjeta con avatar, propiedad de interés, contacto, última actividad (flag de lead frío 5+/10+ días), tag "Alta intención" (IA). Sincronización automática: aceptar una visita del lado comprador crea/actualiza el lead en "Visita Agendada".

### 4.6 Equipo (solo rol Administrador)
Stats agregados del equipo. Tabla de miembros (rol, propiedades, visitas, tasa de respuesta). Panel lateral de detalle con **permisos granulares por toggle** (gestionar propiedades / ver pipeline completo / invitar agentes) en vez de rol fijo. Asignación de lead/propiedad/tarea directo desde el panel. Alerta de leads sin asignar.

### 4.7 Marketing
4 tabs:
- **Cuentas conectadas**: Instagram, Facebook, TikTok, WhatsApp Business — OAuth por plataforma
- **Crear publicación**: selector de propiedad → redes → formato (Post/Historia/Reel) → caption generado por IA (editable, tono seleccionable) → hashtags → preview en vivo (mockup de la plataforma real). **Watermark + CTA horneados en la imagen** (no como UI nativa de la plataforma): pill "kasaa · Publicado con Kasaa" + botón "Agendá tu visita" superpuestos sobre la foto con gradiente, ambos togglables. Link `wa.me` auto-generado con código de propiedad.
- **Calendario**: vista mes con posts programados, reutiliza componente de Agenda
- **Rendimiento**: stats por post (alcance, interacciones, leads generados — cruzando código de propiedad con contactos registrados)

### 4.8 Registro de contacto por WhatsApp
Modal de acceso rápido (FAB flotante o shortcut en Dashboard). Código de propiedad autoresuelve. Si no hay horario coordinado → crea Lead en Pipeline. Si ya hay horario → selector día/hora → crea visita **directo en estado "Confirmada"** (sin pasar por timer de 2hs, porque el agente ya coordinó manualmente).

---

## 5. Reglas de negocio críticas

### 5.1 Ciclo de vida de una visita
```
Comprador solicita (vía card/feed/quick-look)
  → Estado "Pendiente" + WhatsApp al agente + timer de 2 horas inicia
    → Agente ACEPTA dentro de 2hs → "Aceptada" → notifica comprador
    → Agente RECHAZA dentro de 2hs → "Cancelada" → notifica comprador
    → Sin respuesta en 2hs → auto-expira a "Vencida sin respuesta" 
      → afecta métrica "Tasa de Respuesta" del agente
      → comprador ve "No obtuvimos respuesta a tiempo" + opción Reintentar
```
Excepción: visitas creadas por el agente directamente (vía registro de WhatsApp) nacen ya "Confirmada", sin timer.

### 5.2 Reagendar / Cancelar (lado comprador, desde Mis Visitas)
- Reagendar → vuelve a estado "Pendiente" (nuevo timer de 2hs)
- Cancelar → directo a "Cancelada", no requiere aprobación del agente, notifica al agente

### 5.3 Conflicto de horario (lado agente)
Dos pendientes mismo slot → resolución guiada de 3 pasos (ver §4.4) → propuesta por WhatsApp → confirmación manual del agente basada en la respuesta real del cliente.

### 5.4 Auto-pausa de publicación (20 días)
Propiedad activa sin update en 20 días → "Pendiente de confirmación" (no se despublica sola) → agente confirma vigencia o la da de baja.

### 5.5 Fecha Destacada
El agente marca un día/horario como recomendado dentro de la disponibilidad de una propiedad → ese chip aparece preseleccionado y con badge "★ Recomendada" del lado comprador.

### 5.6 Código único de propiedad
Generado automático `PREFIJO-0000` al crear/publicar. Usado como identificador universal: búsqueda en tabla, referencia en WhatsApp, atribución de leads en Marketing.

---

## 6. Mapas de flujo de referencia

- **Ciclo de vida de visita**: Solicitud → Pendiente → Aceptada/Cancelada/Vencida → Mis Visitas (reagendar/cancelar en loop)
- **Feed continuo**: Discovery → Feed inmersivo → swipe genera cola de similares (loop interno) → Coordinar visita / Volver a resultados
- **Conflicto de horario**: Dos pendientes → Elegir confirmado → Reagendar desplazado → WhatsApp → Confirmación manual
- **Lead por WhatsApp**: Post con CTA → WhatsApp externo → Agente coordina → Registro manual en Kasaa → Pipeline (Nuevo Lead) o Agenda (Visita Confirmada)

---

## 7. Notas para desarrollo

- **Dos aplicaciones/rutas separadas** que comparten componentes base: `/` (compradora) y `/agente/*` (panel), unidas por el mismo sistema de auth y la misma base de datos de propiedades/visitas/leads.
- El **timer de 2 horas** y la **auto-pausa a 20 días** requieren un job/cron de backend, no son solo lógica de frontend.
- La integración de WhatsApp es vía **deep link `wa.me`** (no API de negocio) en el MVP — el registro de contactos es manual por diseño. Migrar a WhatsApp Business API queda como mejora de fase 2 cuando el volumen lo justifique.
- Las integraciones de Marketing (Instagram/Facebook vía Meta Graph API, TikTok for Business, WhatsApp) requieren procesos de aprobación de cada plataforma — priorizar Meta (Instagram+Facebook comparten infraestructura) antes que TikTok/WhatsApp Business API.
- El **componente de tarjeta de propiedad** es el más reutilizado del sistema — media canvas + overlays + footer de agenda — aparece en Discovery, Quick Look, Feed inmersivo (variante fullscreen) y Marketing (preview). Vale la pena construirlo como un componente altamente configurable desde el inicio.
- El **selector de día/hora (chips)** es el segundo componente más reutilizado: booking comprador, Agenda del agente, reagendado, resolución de conflictos, programar publicación en Marketing.
