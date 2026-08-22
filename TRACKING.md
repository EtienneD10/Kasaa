# Kasaa — Seguimiento de desarrollo

Registro de decisiones estructurales y estado de avance. Actualizar cada vez
que se agregue una pantalla, se cambie una decisión de arquitectura, o se
identifique deuda técnica. Referencia de diseño completa: `kasaa-spec-completa.md`.

---

## Stack elegido

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- `lucide-react` para iconografía, `clsx` + `tailwind-merge` para clases condicionales
- Estructura de rutas con **route groups**: `(buyer)` para la app compradora, `agente/` para el panel — comparten el mismo proyecto Next.js pero son áreas claramente separadas (spec §7: "dos aplicaciones/rutas separadas que comparten componentes base")

## Por qué estas decisiones

- **Route groups en vez de dos proyectos separados**: comparten auth, tipos, y el componente `PropertyCard`/`DayTimeSelector` sin duplicar código ni necesitar un monorepo todavía. Si el panel de agente crece mucho, se puede separar a una app propia más adelante sin reescribir la lógica de negocio (que vive en `lib/` y `types/`, independiente de las rutas).
- **Tokens de diseño en `globals.css` vía `@theme`** (Tailwind v4): centraliza la paleta de la spec §1.2/§1.3 en un solo lugar. Los componentes nunca hardcodean hex — siempre usan las clases `bg-accent`, `text-buyer-text-muted`, `bg-status-amber-bg`, etc.
- **Mock data en `lib/mock-data.ts`**: hasta que exista backend, todas las pantallas deberían leer de acá para poder probarse de forma aislada.

---

## Rediseño 2026-08 — fidelidad al Figma real

Después de la primera pasada (secciones "Fundación" más abajo), el feedback
fue que el diseño implementado no se parecía a lo pensado. La causa: se
había construido a partir de la interpretación libre de
`kasaa-spec-completa.md`, pero el archivo de Figma real
(`kasaaEstilo1`, conectado vía MCP) diverge del spec escrito en varios
puntos concretos. Se rehizo toda la capa visual tomando el Figma como
fuente de verdad, dejando `kasaa-spec-completa.md` como referencia de
comportamiento/flujos (no de layout exacto). Desvíos encontrados y
resueltos, para que el spec y el código no queden desincronizados en
silencio:

- **Sin campanita de notificaciones en el Header** — no está en el diseño
  real. El Centro de Notificaciones (spec §3.14) va a necesitar otra
  entrada cuando se construya esa pantalla.
- **Comprador logueado sigue viendo "Anunciar propiedad"** (como link de
  texto) — la spec decía que no debía verse para ese rol; el Figma lo
  muestra igual.
- **`PropertyCard` es full-bleed vertical** (foto ocupando toda la tarjeta,
  `aspect-[316/512]`, info superpuesta con gradiente), no
  foto+bloque-de-info-blanco+footer-blanco como se había construido
  primero.
- **Botón único "Solicitar Visita"** en vez de un botón de expandir +
  botón de confirmar separados — clickearlo colapsado expande el
  selector de día/hora, clickearlo expandido y válido confirma.
- **Pill de "Solicitud enviada" (estado sent) SÍ es ámbar** —
  `bg-status-amber-bg` (#FEF3C7) / `text-status-amber-text` (#92400E, token
  nuevo). Ida y vuelta en esta decisión: con la primera captura de
  referencia (baja resolución, vista general del canvas) parecía neutra
  y se corrigió a gris para cumplir la regla de la spec §1.2 de "sin
  colores de estado en la superficie compradora". El usuario después
  confirmó con el frame dedicado `property-card-booking-states` y los
  hex exactos que el pill sí es ámbar en el diseño real — se revirtió a
  ámbar y se documenta como una excepción puntual e intencional a la
  regla general del §1.2 (el resto de la superficie compradora se
  mantiene sin colores de estado).
- **Login/Registro comprador**: imagen a la izquierda ocupa ~60% (no
  50/50), el wordmark vive en la columna del formulario (no sobre la
  foto), inputs con label uppercase + fondo gris relleno (no
  placeholder-only con borde blanco), y los campos del formulario van
  ANTES del divisor "o continuá con" + botones sociales (estaban al
  revés).
- **Login de agente es una card BLANCA sobre fondo oscuro** (`#0F1210`),
  no una card translúcida con texto blanco — con link "¿Olvidaste tu
  contraseña?", botón outline "Registrate como agente" (no un tab) y
  "← Volver a Kasaa" fuera de la card.
- **Registro de agente es una pantalla separada** (`/agente/registro`),
  no un tab dentro del login de agente — reutiliza el mismo
  `AuthSplitShell` marketing que el login/registro comprador, con campos
  propios (nombre de la agencia, matrícula inmobiliaria).
- **Footer del sitio**: el Figma literalmente dice "Hogar" en el bloque
  de marca — se interpretó como texto de plantilla heredado y se dejó
  "Kasaa" por consistencia de producto.
- **Logo/wordmark**: el Figma usa un ícono monograma "K" con forma de
  casa en verde; se aproximó como texto verde + negro (`Logo.tsx`) hasta
  tener el asset SVG real.
- **`PropertyCard` expandida arranca sin día preseleccionado** —
  `property-card-booking-states` muestra "SIN SELECCIONAR" como paso
  propio (solo fila de días, sin fila de horarios, botón "Solicitar
  Visita" deshabilitado) antes de "DÍA + HORA SELECCIONADOS". La primera
  versión preseleccionaba la fecha destacada/la primera al expandir la
  tarjeta, salteando ese paso — corregido en `PropertyCard.tsx`.
- **El link debajo del pill ámbar del estado Sent es "Cancelar", no
  "Cerrar"** — y no es solo un dismiss de la UI: el usuario confirmó que
  anula la solicitud de visita de verdad (`VisitStatus` → "cancelada",
  spec §5.1). Se agregó `onCancelVisit` a `PropertyCard` (mismo patrón
  que `onRequestVisit`) y un handler `cancelVisit` en `DiscoveryClient`
  con el mismo TODO de backend real que `requestVisit`.
- **Quick Look modal construido** (`PropertyQuickLookModal.tsx`) — estaba
  en la lista de pendientes, se adelantó a partir del frame
  `desktop-discovery-default-cards + account-dropdown-menu`. Se abre desde
  el ícono de arriba (galería) de la pila de acciones flotantes de
  `PropertyCard` (confirmado por el usuario sobre una captura con flecha
  señalando ese ícono específico — los otros dos, mute y resumen IA,
  siguen sin acción). Contenido: hero de fotos + badges, precio/specs/
  agente, botones ("Ver visita inmersiva completa" deshabilitado, sin
  feed inmersivo todavía; "Solicitar Visita" cierra el modal y expande el
  booking de la tarjeta de origen), Características (mapea 1:1 con
  `PropertyCharacteristics`), Financiación (`PropertyFinancing`),
  "También te puede interesar" (`relatedProperties()` en `mock-data.ts`,
  mismo barrio primero — las mini-tarjetas usan el mismo lenguaje visual
  que `PropertyCard`: badges 3D Tour/tiempo y specs superpuestos sobre la
  foto con gradiente, no un thumbnail plano con texto abajo; se corrigió
  después de una primera versión simplificada) y Ubicación (placeholder, mismo criterio que
  `MapaPlaceholder` — decisión abierta #5). Limitación conocida: si
  navegás a una propiedad relacionada DENTRO del modal, "Solicitar
  Visita" queda deshabilitado para esa propiedad (el booking real vive en
  la `PropertyCard` de origen en el listado, no hay forma todavía de
  agendar una tercera propiedad sin cerrar el modal y buscarla). El
  toggle "Vídeo" queda deshabilitado — no hay video real todavía
  (decisión abierta #3).
- **Panel de Filtros avanzados construido** (`AdvancedFiltersPanel.tsx` +
  `lib/discovery-filters.ts`) — a partir del frame real
  `desktop-discovery-ai-search + advanced-filters-panel`. El usuario
  aclaró la distinción de producto: la barra de búsqueda del Header
  interpreta palabras clave (texto libre sobre ubicación/título), este
  panel es para filtrar "a mano" con controles estructurados — son dos
  mecanismos separados, no el mismo. Dejó de ser decorativo (antes
  `title="Próximamente"`).
  - **Interacción de apertura pedida explícitamente por el usuario**: fondo
    con blur (`backdrop-blur-sm` + `bg-black/40`) detrás del panel, que se
    desliza desde el margen izquierdo hacia adentro (`translate-x`). El
    componente quedó siempre montado en `DiscoveryClient` (`open` como
    prop en vez de `showAdvancedFilters && <...>`) para que la transición
    de cierre también se vea — desmontar de golpe hace que el cierre sea
    instantáneo, sin tiempo de animar.
  - **Taxonomía de tipo de vivienda ampliada**: `Property["type"]` pasó de
    5 valores a 11 (se agregaron `piso`, `atico`, `estudio`,
    `finca_rustica`, `chalet`, `oficina`) para que los 8 chips de "TIPO DE
    VIVIENDA" del panel tengan con qué filtrar de verdad. De paso, los
    chips rápidos "Ático"/"Estudio"/"Finca Rústica"/"Piso" de la barra de
    Discovery (que ya estaban dibujados pero eran decorativos por esta
    misma razón) también empezaron a filtrar. Se reasignó el `type` de 9
    propiedades mock para tener resultados en cada categoría nueva.
  - **Nuevo campo `Property.amenities`** (`petFriendly`, `balcon`,
    `piscina`, `vistaAlMar`, `cercaDeParques`, `cercaDeMetro`) para la
    sección "Estado de vida" del panel — no existía ningún campo de
    amenities/lifestyle en el modelo antes de esto.
  - **Bug de la primera versión corregido de paso**: los chips rápidos
    "Apartamento"/"Casa" filtraban con lógica AND (`p.type !== "departamento"`
    Y `p.type !== "casa"`), así que activar los dos a la vez vaciaba
    siempre los resultados — nadie lo había notado porque nunca se
    probaron juntos. Ahora es OR sobre todos los chips de tipo activos
    (`activeTypeChips.includes(p.type)`).
  - Cubre filtrado real por: tipo, precio (rango), superficie (rango),
    habitaciones/baños (con "5+"/"2+"), amenities, antigüedad,
    orientación, piso mínimo, ascensor, expensas máximas, disposición,
    cochera, estado de conservación, apto crédito bancario y plan de
    desarrollista — todo mapea a campos que ya existían en
    `PropertyCharacteristics`/`PropertyFinancing` salvo lo anotado arriba.
  - El textarea "Búsqueda IA" del final del panel NO arma estos filtros
    automáticamente a partir de texto libre — por ahora solo alimenta el
    mismo buscador de texto que ya existía. Interpretar lenguaje natural
    en filtros estructurados (y en los chips descartables del estado
    "Resultados para tu búsqueda" de Discovery) sigue siendo la misma
    feature pendiente, ver decisión abierta #8.

- **Panel "Mis Visitas"** (`components/visits/MisVisitasPanel.tsx`) — se
  adelantó de la lista de pendientes, a partir de los frames
  `desktop-discovery-default-cards + panel-mis-visitas` / `+
  cancelar-flow` / `+ visitas-canceladas`. Dropdown que se abre desde el
  ícono `CalendarClock` del Header (rol comprador), con el mismo badge de
  contador de pendientes que ya existía (`pendingVisitsCount`).
  - **Datos mock nuevos**: `mockVisitRequests` en `lib/mock-data.ts` (5
    solicitudes, ids `vr-1`..`vr-5`) — no existía ningún dato de
    `VisitRequest` poblado antes de esto, así que el panel arrancaba
    vacío. El componente mantiene su propia copia en `useState` (se
    resetea al recargar, mismo patrón que el resto de los mocks de esta
    app — no hay backend, ver sección de pendientes).
  - **3 tabs = 3 valores de `VisitStatus`**: Agendadas→`"aceptada"`,
    Pendientes→`"pendiente"`, Canceladas→`"cancelada"`. El cuarto valor
    del enum, `vencida_sin_respuesta`, no tiene tab propia — no apareció
    distinguido de "cancelada" en los frames de referencia; se puede
    separar después si hace falta.
  - **Colores de pill de estado**: Confirmada = verde
    (`status-success`), Pendiente = ámbar (mismos tokens
    `status-amber-bg`/`status-amber-text` del pill de `PropertyCard`),
    Cancelada = rojo (`status-red`/`status-red-bg`, ya definidos en
    globals.css pero sin uso en la superficie compradora hasta ahora) —
    inferido de la referencia (imágenes de baja resolución), mismo
    criterio de "excepción deliberada a la regla de spec §1.2" ya
    documentado para el pill de `PropertyCard`.
  - Click en una fila expande inline: si está `"pendiente"`, muestra un
    `DayTimeSelector` reutilizado (mismo componente que booking en
    `PropertyCard`) para reagendar día/hora + "¿Confirmás esta visita?"
    con "No, gracias"/"Sí, confirmo"; si no, muestra precio+dirección de
    la propiedad. Debajo, "Cancelar visita" lleva a un sub-estado de
    confirmación ("¿Confirmás que querés cancelar esta visita?" con "No,
    mantener"/"Sí, cancelar" en rojo) — mismo patrón de dos pasos que
    "Cancelar" en el estado Sent de `PropertyCard`.
  - Reagendar y cancelar actualizan el estado local de verdad (mueven la
    visita de tab), pero no hay persistencia real — mismo TODO de
    "PATCH /api/visits/:id" ya anotado para el botón "Cancelar" de
    `PropertyCard`.
  - Verificado con Playwright: las 3 tabs muestran los conteos y pills
    correctos, el flujo de reagendado y el de cancelación mueven la
    visita a la tab correcta (`mis-visitas-canceladas.png` confirma que
    la visita recién cancelada aparece junto a la que ya estaba
    cancelada en el mock).

- **Dropdown de cuenta** (`components/account/AccountDropdown.tsx`) —
  reemplaza el avatar-botón decorativo del Header ("Próximamente: Mi
  cuenta"), a partir del frame `desktop-discovery-default-cards +
  account-dropdown`. Header con nombre + email del usuario mockeado
  arriba, y abajo: Mi cuenta, Mis Visitas (con el mismo badge de
  pendientes), Favoritos, Búsquedas guardadas, Configuración, separador,
  Cerrar sesión.
  - **Nuevo campo `MockAuthUser.email`** en `lib/auth-context.tsx` — no
    existía antes (el mock solo guardaba `name`). Los 3 formularios que
    llaman a `login()` (`login/page.tsx`, `agente/login/page.tsx`,
    `agente/registro/page.tsx`) ya pedían el email en el form pero no lo
    pasaban a `useAuth().login(...)`; ahora sí, así que el dropdown
    muestra el email real que el usuario tipeó (o el de
    `DEFAULT_USERS` si se loguea sin pasar por el form).
  - **Solo "Mis Visitas" y "Cerrar sesión" son funcionales de verdad**.
    "Mis Visitas" abre el mismo `MisVisitasPanel` que el ícono de
    calendario del Header (un solo estado `showVisitas` compartido entre
    los dos triggers, para no tener dos paneles independientes
    desincronizados). "Cerrar sesión" llama a `useAuth().logout()` real
    (vuelve al estado invitado, verificado con Playwright:
    `after-logout.png`). "Mi cuenta", "Favoritos", "Búsquedas guardadas"
    y "Configuración" quedan decorativos (`title="Próximamente"`) — no
    hay pantalla ni modelo de datos para ninguno de los tres todavía
    (favoritos hoy es un `Set` local de `DiscoveryClient`, no persiste ni
    tiene vista propia).
  - El frame de referencia es de la superficie compradora. Para el rol
    agente no había una referencia visual, así que se extrapoló un menú
    más corto (Mi cuenta / Configuración / Cerrar sesión, sin Mis
    Visitas ni Favoritos/Búsquedas guardadas, que son conceptos de
    comprador). **Ojo**: ese branch del dropdown está cableado en
    `Header.tsx` pero hoy es inalcanzable en la práctica — `/agente`
    (Dashboard Home) usa su propio header placeholder minimalista, no el
    `Header` compartido, así que no hay ninguna pantalla real donde se
    vea todavía. Se va a activar solo cuando se construya el Dashboard
    Home real con el `Header` compartido.

- **Logo real** (`components/layout/Logo.tsx`) — hasta ahora el wordmark
  era una aproximación en texto/CSS ("k" verde + "asaa" negro con
  Tailwind, sin ningún ícono). El usuario mandó el archivo de marca real
  y se reemplazó por el asset de verdad.
  - `public/kasaa-logo.png` (variante clara, "asaa" negro) y
    `public/kasaa-logo-dark.png` (variante oscura, "asaa" blanco) se
    generaron a partir del JPEG entregado (guardado como referencia en
    `assets-source/kasaa-logo-source.jpg`, no se sirve desde `public/`)
    quitándole el fondo claro con un key por brillo/saturación (alpha
    real con antialiasing en los bordes, no un recorte cuadrado) y
    recoloreando el texto a blanco para la variante dark.
  - El verde de la "k" del archivo entregado (~`#00fe67`) matchea
    prácticamente exacto el token `--color-accent` (`#00ff66`) que ya
    usaba toda la app — buena señal de que es el mismo verde de marca,
    así que no hubo que forzar ningún color.
  - **Solo se recibió una versión del archivo** (sobre fondo claro). La
    variante `kasaa-logo-dark.png` (usada en el header transparente del
    Landing, sobre la foto/hero oscuro) es una recoloreada nuestra, no
    un segundo archivo entregado por el usuario — si en algún momento
    aparece el archivo oficial en blanco, reemplazar ese PNG directo,
    nada más depende de él.
  - `Logo` pasó de renderizar `<span>` con clases Tailwind a un `<img>`
    plano (mismo criterio que el resto de la app — no se usa
    `next/image` en ningún otro lado del proyecto tampoco). Verificado
    con Playwright en las 3 superficies donde aparece: header sólido de
    Discovery (variante clara), card de Login (variante clara) y hero
    transparente del Landing (variante dark, texto blanco legible sobre
    la foto oscura).

- **Drawer de Configuración** (`components/account/AccountSettingsPanel.tsx`)
  — se adelantó de la lista de pendientes, a partir del frame real
  `discovery-drawer-datos`. Se abre desde "Mi cuenta" o "Configuración"
  en `AccountDropdown` (ambos ítems dejaron de ser decorativos). Mismo
  lenguaje visual que `MisVisitasPanel`/`AccountDropdown` (dropdown
  flotante bajo el avatar, no un drawer lateral tipo Filtros avanzados,
  a pesar del nombre del frame en Figma).
  - 4 tabs (`Datos personales`/`Notificaciones`/`Búsquedas`/`Privacidad`)
    como chips, igual que el resto de los chips de filtro de la app. Solo
    había referencia visual de "Datos personales" — las otras 3 quedan
    con contenido placeholder ("— próximamente") hasta que aparezca el
    frame de cada una.
  - Tab "Datos personales": foto de perfil (circle con iniciales, sin
    upload real — "Cambiar foto de perfil" es decorativo, no hay
    storage de imágenes), Nombre completo / Correo electrónico /
    Teléfono móvil (éste último con el pill "WhatsApp" de la
    referencia, decorativo — no valida que el número esté vinculado a
    WhatsApp de verdad) y "Guardar cambios".
  - **"Guardar cambios" es funcional de verdad**: llama a
    `useAuth().updateUser(...)` (método nuevo agregado a
    `AuthContextValue`, junto con el campo `phone` en `MockAuthUser`),
    así que el nombre/email que se edita ahí se refleja al instante en
    el resto del Header (iniciales del avatar, nombre/email de
    `AccountDropdown`) — no es un formulario de mentira. Verificado con
    Playwright (`settings-saved.png`: iniciales pasan de "A" a "AM" y el
    nombre/email del panel cambian en el momento).
  - Simplificación: "Mi cuenta" y "Configuración" abren el mismo panel
    en la misma tab por defecto — no había una segunda referencia que
    mostrara alguna diferencia de comportamiento entre los dos.

- **Re-chequeo de `PropertyCard` contra el frame resumen "Property Card
  — Estados de Booking"** (4 estados lado a lado: default, día
  seleccionado, día+hora seleccionados, solicitud enviada). Se
  sampleó color directo del PNG de referencia (no a ojo) para
  confirmar diferencias reales vs. ruido de compresión — el pill ámbar
  ya confirmado matcheó su hex casi exacto en esta misma imagen, así
  que se usó como control de fiabilidad de la paleta.
  - **Nuevo token `--color-accent-soft: #74fa79`** — el botón
    "Solicitar Visita" (los 2 estados: colapsado y expandido-habilitado)
    y, dentro de `DayTimeSelector`, el pill "HOY" y el horario
    seleccionado usan este verde más claro, no el accent neón
    (`#00ff66`) que se venía usando. El accent neón se mantiene sin
    cambios para badges/bordes/dots/links (confirmado con el mismo
    sampleo: el borde+dot de "VENTA" y el borde del día seleccionado sí
    siguen siendo el neón). Aplicado también al botón "Solicitar Visita"
    de `PropertyQuickLookModal` (antes en accent neón) para no dejar
    dos versiones de color del mismo CTA en la app — los botones
    "Guardar cambios"/"Sí, confirmo" de `MisVisitasPanel`/
    `AccountSettingsPanel` quedan en accent neón por ahora, sin
    referencia que pida cambiarlos.
  - **Ícono del 3er botón flotante corregido**: era `Sparkles`
    ("resumen IA"), la referencia muestra un rayo (`Zap`) — se
    corrigió el ícono; la acción sigue sin funcionalidad real
    (`title="Próximamente: resumen IA"`) porque no está claro qué
    feature representa el rayo todavía.
  - **"Ver más" (junto a "Agenda tu visita inmersiva") ahora abre el
    Quick Look de verdad** — había quedado decorativo cuando se escribió
    esa línea porque `PropertyQuickLookModal` todavía no existía; ya que
    existe, no tenía sentido dejarlo sin acción.
  - **Discrepancia encontrada y resuelta con el usuario**: esta misma
    referencia muestra el botón del estado "Solicitud enviada" como
    "Cerrar", pero el usuario había pedido explícitamente en un turno
    anterior que dijera "Cancelar" y anulara la visita de verdad. Se
    preguntó directo — el usuario confirmó mantener "Cancelar" con
    anulación real tal cual estaba, ignorando la referencia en este
    punto puntual. Sin cambios en ese botón.

- **Segunda corrección de `PropertyCard` (estado Default) contra una
  referencia distinta**: el usuario volvió a marcar el mismo problema
  ("seguimos con el mismo problema con la visual de las tarjetas") y
  pasó una captura nueva, de mejor resolución, de una sola tarjeta con
  anotación. Comparando pixel a pixel contra esa referencia aparecieron
  varios desvíos que la pasada anterior no había detectado (esa pasada
  trabajaba sobre el frame resumen de 4 estados, más chico):
  - **No hay franja blanca en el estado Default**: los botones "Ver en
    3D"/"Solicitar Visita" flotan sobre la propia foto, al pie de la
    tarjeta, no en un footer blanco separado (el footer blanco sigue
    existiendo tal cual para Scheduling/Sent).
  - **Pila de acciones flotante corregida**: los 3 íconos eran
    `Images`/`Volume2`/`Zap` (galería/mute/IA); la referencia muestra
    grilla (`Grid3x3`, abre Quick Look), ubicación (`MapPinned`,
    decorativo — "Próximamente: ver en el mapa", sin mapa real todavía)
    y un "+" verde que es el toggle real de favorito (antes vivía junto
    al precio). Los dos primeros van SIN círculo de fondo (ícono blanco
    con sombra directo sobre la foto); sólo el "+" lleva círculo sólido
    — antes los 3 compartían el mismo círculo negro traslúcido. La pila
    ya no está centrada en toda la altura de la foto, arranca más cerca
    del bloque de texto inferior.
  - **Specs (Dorm/Baños/m²) sin píldora ni íconos**: antes reusaban el
    mismo tratamiento que los badges superiores (píldora oscura +
    íconos `Bed`/`Bath`/`Maximize`); la referencia las muestra en texto
    blanco plano directo sobre la foto, separadas por "|". Corregido.
  - **Pill "VENTA" con fondo oscuro** (como los otros 2 badges), no
    blanco — dot y texto en verde accent, confirmado sampleando el PNG.
  - **Ícono de reloj agregado** al pill de tiempo ("🕐 Hace 2h").
  - **Indicador junto al precio reinterpretado como vistas**: la
    referencia muestra un círculo simple + número (no un corazón) junto
    al avatar del agente — se usa `Eye` con el mismo criterio ya
    documentado en `InterstitialCard.tsx` (`favoriteCount × 3.4`,
    placeholder por no haber campo propio en el modelo). Es de solo
    lectura; el toggle de favorito real se movió al botón "+" de arriba.
    El avatar de esta fila además va SIN borde ni indicador de estado
    (la referencia lo muestra pelado) — distinto de la fila de agente
    del footer de Scheduling, que sí los tiene y no se tocó.
  - **Botones sin ícono en este estado**: "Ver en 3D"/"Solicitar Visita"
    van en texto plano, sin `Box`/`CalendarClock` — sólo en Default (el
    estado Scheduling mantiene sus íconos).
  - **Overflow de precio/avatar/vistas**: con el layout ya corregido
    apareció un problema nuevo que no tiene que ver con la referencia
    sino con el ancho angosto de la grilla de 3 columnas de Discovery —
    precios largos de venta (ej. "US$2.980.000", "US$3.800.000")
    empujaban el avatar+vistas fuera de la tarjeta y el borde
    redondeado + `overflow-hidden` del contenedor los recortaba a la
    mitad. Se bajó el precio de `text-2xl` a `text-xl` (con `truncate`
    como resguardo para un caso aún más extremo) y se marcó el grupo
    avatar+vistas como `shrink-0` — verificado con Playwright contra el
    precio más alto del mock (Diagonal Mar, US$3.800.000) y ya entra
    completo sin recortarse.
  - **Contradicción con la decisión anterior de color**: esta misma
    referencia sampleó "Solicitar Visita" en verde accent neón puro
    (0,255,91 ≈ `#00ff66`), no en `accent-soft` (#74fa79) como se había
    fijado en la pasada de "Re-chequeado contra el frame resumen" (arriba
    en esta misma sección) a partir de otra imagen. Sólo se corrigió el
    estado Default (el único que muestra esta referencia nueva) a
    `bg-accent`; el botón del estado Scheduling y el de
    `PropertyQuickLookModal` quedaron en `accent-soft` — **pendiente de
    confirmar con el usuario si también hay que pasarlos a accent neón**
    para no dejar tres versiones de color del mismo CTA en la app.
  - Verificado: `npm run build` y `npx eslint .` limpios; capturas
    Playwright contra `/discovery` con la grilla completa (24 tarjetas,
    fotos de Unsplash no cargan en este sandbox — se ven como fondo
    negro, no es un bug del componente, es la restricción de red ya
    documentada) confirmando el layout contra 3 tarjetas distintas
    (precio más caro, más barato, y uno intermedio).

- **`DayTimeSelector` — ventana fija de 4 días desde hoy**: antes la
  fila de días se armaba directo de `Set(slots.map(s => s.date))`, es
  decir, de los offsets sueltos de `availabilityDays` de cada propiedad
  mock (ej. `[2, 5]` o incluso `[]`). Eso significaba que la cantidad y
  el rango de días mostrados variaba por propiedad — algunas mostraban
  menos de 4 días, salteados, o directamente ninguno, en vez de arrancar
  siempre desde "hoy" (el día en que la persona está mirando el aviso,
  como pidió el usuario). Ahora `DayTimeSelector` genera siempre 4 días
  consecutivos (hoy, hoy+1, hoy+2, hoy+3) independientemente de qué haya
  en `availability`; si un día de esos 4 no tiene horarios en el mock,
  el chip se ve y se puede clickear igual, y muestra el mensaje "Sin
  horarios disponibles este día" que ya existía (no hubo que agregar
  nada ahí). Afecta a todos los que reusan el componente: `PropertyCard`
  y el reagendado de `MisVisitasPanel`. Verificado con Playwright en
  varias propiedades del mock, incluida una con día sin horarios
  (`day4-clicked.png`).

Con esto, `/agente` dejó de ser un 404: ahora existe un gate por rol
(`agente/page.tsx`) — invitado se redirige a `/agente/login`, comprador ve
"Acceso restringido" (frame `agent-access-restricted`), agente ve el
Dashboard Home real (`AgentSidebar` + `AgentDashboardHome`, ver más abajo).
El auth mock vive solo en memoria de React (sin localStorage/cookies), así
que una navegación dura (escribir la URL, recargar) siempre vuelve al
estado invitado — es una limitación conocida del mock, no un bug; al
elegir proveedor de auth real (decisión abierta #2) esto se resuelve solo.

- **Dashboard Home del panel de agente** (frame real `dashboard-home`) —
  reemplaza el placeholder de `/agente` para el rol `agente`. Dos
  componentes nuevos: `AgentSidebar.tsx` (nav oscuro) y
  `AgentDashboardHome.tsx` (contenido principal). Decisiones y desvíos
  notados al construirlo:
  - **Nuevo agente mock, `agt-4` "María Rodríguez" / "Agencia Palermo
    Gold"** (`lib/mock-data.ts`) — se optó por crear un agente logueado
    separado en vez de reusar `agt-1` ("María García", ya usada del lado
    comprador en 8 propiedades) para no mezclar identidades entre las dos
    superficies de la app, aunque el frame real coincida casi textual con
    el perfil de agt-1 en algunos números.
  - **5 propiedades nuevas para el catálogo de agt-4** (`p25`-`p29`),
    con geografía de Buenos Aires (Palermo/San Telmo, CABA) tomada literal
    del frame, mientras el resto del mock de comprador sigue ambientado en
    Barcelona — inconsistencia geográfica conocida, no se homogeneizó
    para no tocar las 24 propiedades ya usadas en Discovery/Filtros.
    `p26` está en estado `borrador`, `p27` en `vencida` (`updatedDaysAgo:
    -22`, dispara la alerta de "+20 días sin confirmar vigencia"), `p28`
    no tiene foto (dispara la alerta "Propiedad sin imágenes").
  - **Bug latente corregido en `toProperty()`**: `status` estaba
    hardcodeado a `"publicada"` para absolutamente todas las propiedades
    del mock, sin mirar el blueprint — ninguna propiedad podía tener
    `"borrador"`/`"vencida"`/`"pausada"` antes de esto. Se agregó
    `Blueprint.status` (opcional, default `"publicada"`) y se usa de
    verdad en `toProperty()`. También se hizo `Blueprint.photo` opcional
    para poder tener una propiedad sin fotos.
  - **`mockAgentTodayVisits` / `mockAgentAttentionItems` /
    `mockAgentDashboardStats`** (nuevos exports en `mock-data.ts`) — las
    visitas de "Timeline del Día" y las 4 alertas de "Atención Requerida"
    se leen de ahí; los números de "Atención Requerida" están escritos a
    mano en base al texto real del frame (no se derivan 100% de las
    visitas/propiedades — sería sobre-ingeniería para 4 tarjetas fijas).
    Los stats de `mockAgentDashboardStats` (Propiedades Activas, Visitas
    del Mes + desglose, Leads Activos) quedan como constantes
    ilustrativas a propósito (no hay Pipeline de leads construido
    todavía para derivarlos de verdad) — la excepción es "Tasa de
    Respuesta", que en `AgentDashboardHome` sí se deriva de verdad de
    `agt-4.responseRateWithin2h` (vía `mockPropertyById.get("p25")!.agent`,
    ya que `agents` no se exporta directo desde `mock-data.ts`).
  - **`AgentSidebar`**: solo el ítem "Dashboard" navega de verdad (única
    pantalla construida del panel todavía); el resto (Propiedades,
    Agenda, Pipeline, Equipo, Marketing, Configuración) quedan
    decorativos (`title="Próximamente"`). Los badges de color son counts
    reales derivados del mock (alertas críticas, visitas pendientes de
    hoy, leads nuevos, propiedades activas), no inventados a mano. El
    wordmark del sidebar es texto plano ("kasaa" blanco + tag "Agentes"),
    no el componente `Logo` — el frame real de este sidebar específico no
    tiene la "k" en verde, a diferencia del resto de la app.
  - **Toggle "Mi actividad" / "Todo el equipo"**: solo "Mi actividad" es
    funcional (cambia un estado local, sin efecto en los datos porque el
    mock solo tiene un agente); "Todo el equipo" es decorativo. La
    campanita de notificaciones también es decorativa — no hay Centro de
    Notificaciones para agentes.
  - **Colores de badges de "Catálogo Activo"** confirmados con zoom sobre
    el PNG de referencia: `publicada`→"EN VENTA" (verde claro/texto verde
    oscuro, mismo patrón `bg-status-success/15 text-emerald-700` que ya
    usaban las visitas "Confirmada"), `borrador`→"BORRADOR" (gris
    neutro), `vencida`→"VENCIDA" (rojo claro/texto rojo, mismo patrón que
    "Cancelada"); el badge de tipo ("DEPARTAMENTO"/"ÁTICO") siempre es un
    pill outline gris neutro sin importar el estado.
  - **⚠️ Posible descuido en el archivo de Figma**: en "Timeline del
    Día", la fila de Pedro Gómez (17:00, visita `cancelada`) usa
    exactamente el mismo verde que las filas `CONFIRMADA` — confirmado
    con zoom, no es error de sampleo de color. Se replicó tal cual acá
    por fidelidad pixel-a-pixel (`TIMELINE_STATUS_STYLES.cancelada` usa
    el mismo `className` que `.aceptada` en `AgentDashboardHome.tsx`),
    pero vale la pena que el usuario lo confirme contra su Figma — lo
    esperable sería que "Cancelada" tuviera un tratamiento neutro/rojo
    como en el resto de la app (`MisVisitasPanel`).
  - **⚠️ Interpretación de baja confianza**: los botones de aceptar/
    rechazar de la fila `pendiente` (Gastón Pérez, 11:30) — el ícono de
    "rechazar" en la referencia era ambiguo a esta resolución; se usó una
    "X" en círculo rojo como interpretación razonable, pero no está
    confirmado contra el frame real. Ambos botones son decorativos
    (`title="Próximamente"`), no hay backend para aceptar/rechazar
    visitas todavía.
  - Catálogo Activo muestra exactamente `p25`/`p26`/`p27` y Timeline del
    Día exactamente `avr-1`..`avr-4`, tal cual el frame real —
    `avr-5` (Pedro Muñoz) no aparece en el Timeline, solo dispara la
    alerta crítica de "1 Visita a punto de vencer".

- **Pipeline de Leads + Tu equipo** (frames reales `pipeline-kanban` /
  `equipo-team`, enviados juntos en un solo PNG compuesto) — dos
  pantallas nuevas del panel de agente, `/agente/pipeline` y
  `/agente/equipo`. Se aprovechó para sacar el gate por rol + sidebar de
  `agente/page.tsx` a un layout compartido nuevo,
  `agente/(panel)/layout.tsx` (route group, no cambia ninguna URL) —
  `/agente/login` y `/agente/registro` quedan afuera del grupo a
  propósito, no deben pasar por el gate.
  - **⚠️ Resolución de la referencia**: este PNG llegó bastante más chico
    que las referencias anteriores de la sesión (774×300 el compuesto
    completo, ~387×300 por pantalla) — no hay una versión de mayor
    resolución disponible (se confirmó comparando contra el archivo
    adjunto). La estructura general (columnas, colores, layout de tarjeta/
    fila, secciones del panel derecho) se pudo confirmar bien zoomeando al
    máximo, pero el texto fino de algunas celdas (el pill ámbar de las
    tarjetas del Kanban, algunos dígitos de la fila de stats) quedó en el
    límite de lo legible — se documenta caso por caso abajo. Si el usuario
    tiene estas 2 pantallas en mayor resolución, vale la pena revisar esos
    puntos puntuales contra el original.
  - **Pipeline de Leads**: 6 columnas = los 6 valores de `LeadStage`
    (el frame solo muestra una columna "Cerrado", sin separar ganado/
    perdido — se usa `cerrado_ganado` para los leads cerrados del mock;
    `cerrado_perdido` queda soportado por el tipo pero sin leads todavía).
    Franja de color por columna confirmada con zoom: azul (Nuevo Lead/
    Contactado), ámbar (Visita Agendada/Visita Realizada), verde
    (Negociación/Cerrado). El badge de conteo por columna se cuenta de
    verdad (`leads.filter(...).length`), no está copiado a mano. El
    buscador de texto (por nombre) filtra de verdad; los selects
    "Propiedad"/"Agente" y "+ Nuevo Lead" quedan decorativos. Sin
    drag-and-drop entre columnas (no pedido, y el frame no alcanza a
    mostrar esa interacción). El ícono verde de cada tarjeta es un botón
    de WhatsApp decorativo — la integración real sigue en la lista de
    pendientes de Backend, no se adelantó acá.
  - **⚠️ Pill "Alto interés"**: el texto exacto del pill ámbar de las
    tarjetas con `highIntent: true` era ilegible a esta resolución — se
    usó "ALTO INTERÉS" como interpretación razonable, sin confirmar.
  - **⚠️ "Hace X" con granularidad de día, no de hora**: la referencia
    parecía decir "hace 2 horas" en alguna tarjeta, pero el mock de
    `mockLeads` (como el resto de `mock-data.ts`) solo tiene fechas, sin
    hora — se muestra "Hoy"/"Ayer"/"Hace N días" calculado de verdad
    desde `lastActivityAt`, en vez de copiar un texto con precisión que
    el modelo de datos no puede respaldar.
  - **Tu equipo**: nuevos agentes de equipo `agt-5` Carlos Martínez,
    `agt-6` Sofía Lares, `agt-7` Gastón Pérez (además de `agt-4` María
    Rodríguez, que pasa a tener `role: "admin"`) — `Agent` ganó los
    campos opcionales `role`/`permissions`. La fila de stats de arriba
    ("N agentes activos · N leads sin asignar · N visitas · N% respuesta
    promedio") se calcula de verdad: tamaño de `mockTeamMembers`, conteo
    real de `mockLeads` con el nuevo sentinel `UNASSIGNED_AGENT_ID` (2
    leads, "Martina Suárez" y "Diego Ramos", que no aparecen en el
    Pipeline de agt-4 a propósito), `mockAgentDashboardStats.
    visitasDelMes` (mismo dato que el Dashboard Home) y el promedio real
    de `responseRateWithin2h` de los 4 miembros. El banner amarillo se
    puede cerrar de verdad (estado local); "Ver y asignar" queda
    decorativo. Click en una fila del listado selecciona ese agente en el
    panel derecho (funciona de verdad, estado local) — default
    "Carlos Martínez", tal cual estaba seleccionado en la referencia. Los
    3 toggles de "Permisos y Roles" reflejan `agent.permissions` del
    agente seleccionado pero son de solo lectura (decorativos,
    `title="Próximamente"`) — no hay backend para persistir cambios de
    permisos. "Asignar lead"/"Asignar propiedad", su buscador y
    "Desactivar Agente" quedan decorativos por el mismo motivo.
  - **⚠️ Columnas "Prop. Act." / "Leads" de la tabla, constantes
    ilustrativas**: se leyeron con zoom (María 12/28, Carlos 9/11, Sofía
    0/14, Gastón 0/0) y se guardaron tal cual en `mockTeamStats`, pero
    **no sonan cross-frame con `dashboard-home`**: ahí
    `mockAgentDashboardStats.propiedadesActivas` = 12 es el total de TODA
    la agencia, mientras que acá la fila de María Rodríguez individual
    también muestra "12" — sumando las 4 filas da 21 propiedades, muy por
    encima de las 5 reales que existen en el mock (`p25`-`p29`). Es una
    inconsistencia que ya traía el archivo de referencia entre estos 2
    frames, no algo introducido acá — se documenta en vez de forzar una
    reconciliación inventando propiedades de más. "Respuesta %" sí sale
    de verdad de `agent.responseRateWithin2h` en cada fila.
  - **Nota de color**: "Gastón Pérez" es, en este mock, un AGENTE del
    equipo de María Rodríguez — coincidencia de nombre con el comprador
    "Gastón Pérez" que ya existía en `mockAgentTodayVisits` (una visita
    del lado Dashboard Home). Son personas distintas en la ficción del
    producto; se mantuvo el nombre tal cual lo mostraba el frame en vez
    de cambiarlo para evitar la confusión, y se dejó la aclaración en el
    comentario de `mock-data.ts`.
  - **Emails de los agentes de equipo** (`carlos@kasaa.com`, etc.) se
    derivan en el componente a partir del nombre (`Agent` no tiene campo
    `email` propio) — no son datos guardados, son una función simple
    `deriveEmail()`.
  - `AgentSidebar`: los ítems "Pipeline" y "Equipo" pasan a ser links
    reales (antes decorativos); "Propiedades"/"Agenda"/"Marketing"/
    "Configuración" siguen sin pantalla propia.

- **Propiedades + regla de 20 días** (frames reales
  `propiedades-table-view` / `confirm-listing-modal`, enviados juntos) —
  `/agente/propiedades`: tabla del catálogo de agt-4 con selección
  múltiple, y la implementación REAL de la regla de vigencia que pidió
  el usuario: "desde el momento que agregan cada propiedad tienen 20
  días para que esté en tiempo, luego se activa una alerta... y se pausa
  la publicación".
  - **Nueva regla derivada, no un campo más del mock**: `lib/
    property-status.ts` exporta `getListingStatus(property)` — si una
    propiedad `publicada` lleva ≥20 días sin actualizar (`lastUpdatedAt`),
    se muestra como `pendiente_confirmacion` (pill ámbar + ícono de
    reloj clickeable); si pasan `PAUSE_GRACE_DAYS` (7 días, no
    especificados por el usuario — elegidos como valor razonable,
    fácil de ajustar) más sin respuesta, pasa sola a `pausada`. No se
    guarda un status separado por esto: se recalcula en cada render a
    partir de `lastUpdatedAt`. `borrador`/`vencida`/`pausada` seteados a
    mano en el mock NO se recalculan (son estados finales/manuales).
    `PropertyStatus` ya tenía los 3 valores necesarios desde antes de
    esta sesión (`pendiente_confirmacion` incluso ya tenía el comentario
    "regla de 20 días, spec §5.4") — no hizo falta tocar el tipo.
  - **`ConfirmListingModal`** — el modal "¿Esta propiedad sigue
    disponible?": "Sí, sigue disponible" resetea `lastUpdatedAt` a hoy
    (acción real); "No, ya no está disponible" pasa el `status` real a
    `pausada` (acción real); "Recordarme en 3 días" queda decorativo (no
    hay backend de recordatorios). Se abre desde el ícono de reloj de la
    fila en la tabla, y también desde el Dashboard Home vía
    `/agente/propiedades?confirmar=<id>` (ver más abajo) — se lee con
    `useSearchParams` + lazy initializer de `useState` (no en un
    `useEffect`, para no disparar el lint de "setState síncrono dentro
    de un efecto").
  - **Cambio retroactivo intencional sobre el Dashboard Home ya
    construido**: p25 ("Av. del Libertador 2400") pasó de
    `updatedDaysAgo: -3` a `-20` a propósito, porque el frame nuevo la
    usa como ejemplo de "Pendiente de confirmación" — antes se veía como
    "EN VENTA" en el Catálogo Activo del Dashboard. El Catálogo Activo
    ahora lee `getListingStatus(p)` en vez de `p.status` directo (mismos
    colores para `pendiente_confirmacion`/`pausada` que la tabla nueva),
    así que ambas pantallas quedan consistentes entre sí. La alerta
    "att-2" ("Publicaciones necesitan confirmar") de Atención Requerida
    también se actualizó: título/cuerpo ahora muestran el conteo REAL de
    propiedades pendientes (antes era el texto fijo "3 Publicaciones..."
    del mock) y su botón "Confirmar vigencia" es un link real a
    `/agente/propiedades?confirmar=<primera-pendiente>`.
  - **p28 (Humboldt 1900) corregido de `publicada` a `borrador`** — el
    frame nuevo la muestra con pill "BORRADOR", y de paso tiene más
    sentido de negocio (una propiedad sin fotos todavía no debería
    poder estar publicada). No afecta nada que ya se hubiera mostrado
    (el Catálogo Activo del Dashboard nunca incluyó a p28).
  - **p27 sigue `vencida` explícito** — se aclaró en su comentario que
    es un estado terminal/manual, no atado al timer de 20 días (antes de
    esta tarea el comentario decía "+20 días sin confirmar vigencia",
    que en realidad describe mejor a `pendiente_confirmacion`).
  - **4 propiedades nuevas** `p30`-`p33` (Av. Santa Fe 4400/Recoleta,
    Juramento 1500/Belgrano, Av. Callao 1000/Recoleta, Cabildo 2000/
    Belgrano) para completar las 8 filas de la referencia — p30 con
    `updatedDaysAgo: -20` (2da fila "Pendiente de confirmación" del
    frame) y p31 con `-30` (más allá del período de gracia → se pausa
    sola, demuestra que el auto-pausado funciona sin setear `status:
    "pausada"` a mano).
  - **⚠️ Resolución de la referencia**: mismo tamaño chico que
    `pipeline-kanban`/`equipo-team` (371×529 el compuesto completo) — no
    hay versión de mayor resolución disponible. La estructura (columnas,
    colores de pills, el modal completo) se confirmó bien con zoom; los
    dígitos exactos de "VISITAS"/"LEADS" y el nombre exacto de esas 2
    columnas quedaron en el límite de lo legible — se los trató como
    constantes ilustrativas nuevas (`mockPropertyPerformance` en
    `mock-data.ts`), mismo criterio que `mockTeamStats`. "ACTUALIZADA" sí
    se calcula de verdad desde `lastUpdatedAt`.
  - Buscador (por código o dirección) y paginación (8 por página) son
    reales — con las 9 propiedades del mock, la página 2 muestra la 9na
    de verdad (se pudo demostrar sin necesidad de más mock data). Los
    selects "Estado"/"Tipo" y "+ Nueva Propiedad" quedan decorativos (no
    hay editor de propiedad todavía). "Eliminar seleccionadas" de la
    barra de acciones masivas también queda decorativo (acción
    destructiva sin backend) — "Pausar seleccionadas" sí es real.

- **Agenda del agente** (frames `agent-agenda-screen` + "Flujo de
  Resolución de Conflictos", `/agente/agenda`) — calendario semanal real
  (`AgentAgenda.tsx`) más el wizard de 3 pasos para resolver dos visitas
  que caen en el mismo horario (`ConflictResolutionModal.tsx`). Las
  referencias llegaron en buena resolución (739×559 y 944×441, bastante
  mejor que Pipeline/Equipo) así que hubo pocas lecturas de baja
  confianza esta vez.

  - El calendario es un grid Lun→Dom real: cada visita (`VisitRequest`,
    ahora con `slot.durationMinutes` opcional — default 45 si falta,
    campo nuevo en `AvailabilitySlot`) se ubica en su columna/fila según
    `slot.date`/`slot.time` de verdad, no está pre-armado a mano por
    pantalla. El frame etiquetaba las columnas "LUN 11…DOM 17", pero esa
    fecha no existe en el calendario real (11 de agosto no cae lunes
    ni en 2026 ni cerca) — es una semana de ejemplo del diseño. Para que
    Agenda funcione de verdad cualquier día que se abra la app, se
    reprodujo la misma ESTRUCTURA relativa a "hoy" (mismo criterio que
    el resto del mock, `iso(offset)`): la columna "hoy" del frame es un
    jueves, y da la casualidad de que hoy también cae jueves, así que el
    mapeo quedó Lun=-3 … Jue=0 (hoy) … Dom=+3. `lib/agenda.ts` tiene
    todos los helpers puros (`getWeekDays`, `visitsOverlap`,
    `findConflictGroups`, `assignLanes`, etc.), mismo espíritu que
    `property-status.ts`.
  - **Conflictos de horario son de verdad, no hardcodeados**: cualquier
    par de visitas del agente (pendiente o aceptada, no importa la
    propiedad) que se superponen en horario un mismo día se detecta con
    `findConflictGroups()` y dispara el wizard al tocar la card — no es
    un caso especial sólo para Ana García/Pedro Muñoz, esos dos son
    simplemente la semilla del mock (`avw-7`/`avw-8`, viernes 09:00,
    "PH San Telmo" = p29). Las cards superpuestas se dibujan lado a lado
    con `assignLanes()` (sin esto, la de más arriba tapa a la otra por
    completo y ni se ve ni se puede tocar — se detectó con Playwright en
    la primera pasada) y llevan un ícono de alerta en vez del punto de
    color normal.
  - **"Flujo de Resolución de Conflictos" se implementó como UN modal de
    3 pasos**, no como 3 cards separadas: el frame de referencia las
    mostraba una al lado de la otra con flechas "PASO 2"/"PASO 3" — eso
    era la puesta en escena de la presentación (tenía hasta un título
    "Prototipo interactivo de reserva superpuesta..." en fondo oscuro,
    que no es UI de la app), no cómo funcionaría de verdad. Paso 1:
    elegís a quién confirmar de los dos candidatos ("Confirmar a este").
    Paso 2: elegís día (chips Lun-Dom de la misma semana) + horario
    (6 franjas fijas 09:00-11:30, mismas que el frame) para reagendar al
    otro, con vista previa del mensaje de WhatsApp armada de verdad con
    nombre/propiedad/día/hora reales. Paso 3: "Propuesta enviada" con
    los botones "Pedro confirmó"/"Pedro rechazó" — son la simulación de
    la respuesta del comprador por WhatsApp (no hay integración real
    todavía, spec §7), pero SÍ aplican una acción real sobre el estado:
    "confirmó" reagenda la visita al nuevo horario y la pasa a
    aceptada; "rechazó" la cancela. "Reenviar por WhatsApp" y el aviso
    de "te lo recordaremos en 24hs" quedan decorativos.
  - **Franjas deshabilitadas del Paso 2 — desvío documentado a
    propósito**: el frame de referencia mostraba 09:00 y 11:30
    deshabilitados pero 09:30 habilitado, a pesar de que ese mismo día
    Ana García ya tenía una visita de 09:00 a 09:45 (que se solapa con
    un horario de 09:30) — el frame en sí no es consistente con ninguna
    regla única de solapamiento real. Se probó primero con "deshabilitar
    sólo si otra visita arranca exactamente a esa hora" (más simple,
    más parecido al frame), pero eso permitía reagendar una visita
    justo encima de otra ya confirmada el mismo día — el wizard
    terminaba creando un conflicto nuevo en el mismo paso en el que se
    suponía que resolvía uno, comprobado con Playwright. Se optó por
    chequeo de solapamiento real (`isSlotTaken()` en `lib/agenda.ts`,
    duración fija de 30 min para toda visita reagendada) — prioriza que
    la herramienta no permita crear conflictos nuevos por encima de
    calcar exactamente esas dos celdas del frame.
  - **Botón "Bloquear horario"** (`BlockScheduleModal.tsx`) — nuevo,
    real: el agente elige día/desde/hasta/motivo y el hueco aparece en
    el calendario con el mismo estilo punteado + candado que la semilla
    "No dispon..." del jueves (`BlockedSlot`, tipo nuevo en
    `types/index.ts`; la semilla vive en `mock-data.ts`, los que arma el
    usuario quedan en memoria del componente). Cada bloqueo tiene un "×"
    para sacarlo.
  - **Detalle de visita**: el frame mostraba un popover flotante anclado
    a la card (con propiedad, comprador, teléfono, WhatsApp decorativo y
    "Ver detalle" decorativo) — se implementó como modal centrado
    (`VisitDetailModal.tsx`, mismo patrón que `ConfirmListingModal` de
    Propiedades) por simplicidad/robustez, mismo contenido. Se agregó
    algo que el frame no mostraba pero que pedía el usuario en su
    mensaje ("la agenda va a depender directamente de la aceptación...
    o canceladas"): si la visita está pendiente, "Confirmar visita"/
    "Cancelar visita" son acciones reales sobre el estado — resuelve
    parte del ítem que quedaba pendiente en este archivo ("acciones
    reales de aceptar/rechazar", ver checklist de Panel de agente).
  - **Propiedades nuevas para Agenda**: 4 de las 5 propiedades que
    aparecen en el calendario ya existían (p25 "Depto Palermo 3amb", p29
    "PH San Telmo" — mismo alias que ya usaba la alerta de Atención
    Requerida del Dashboard —, p31 "Casa Belgrano", p32 "Depto
    Recoleta"); se agregó **p34 "Loft a Nuevo en Núñez"** porque la
    visita de Laura Gómez referenciaba un barrio/tipo (Núñez, loft) que
    no existía todavía entre p25-p33 — se prefirió una propiedad nueva y
    honesta antes que reusar una de otro barrio bajo un nombre corto que
    no le correspondía. Los nombres cortos ("Depto Palermo 3amb", etc.)
    son un alias sólo de Agenda (`AGENDA_SHORT_LABELS` en
    `lib/agenda.ts`) — no reemplazan `Property.title` en ningún otro
    lado.
  - Teléfonos de Ana García (+54 11 4444-5678) y Pedro Muñoz
    (+54 11 3333-9012) copiados tal cual del frame del flujo de
    conflictos (los únicos dos legibles con certeza) — el resto de los
    teléfonos de la semana son inventados, mismo criterio que el resto
    del mock.
  - **"Mes" queda decorativo** (`title="Próximamente"`) — sólo se
    construyó la vista Semana, la única que mostraba la referencia.
  - **"Solo mis visitas"** es un toggle real en el sentido de que
    cambia de estado al tocarlo (con feedback visual), pero hoy no
    filtra nada — todavía no existe una fuente de visitas de OTROS
    agentes para contrastar (Equipo/Pipeline sí tienen varios agentes,
    pero no visitas propias por agente). Los selects "Estado"/"Tipo" no
    existen acá (a diferencia de Propiedades) — sí son reales el
    buscador y los checkboxes de propiedad/estado del panel de filtros.

---

## Estado de avance

### ✅ Fundación (hecho)
- [x] Proyecto Next.js + Tailwind + TypeScript configurado, build verificado
- [x] Tokens de diseño (colores, radios, tipografía) en `globals.css`
- [x] Tipos centrales (`Property`, `VisitRequest`, `Lead`, `Agent`, etc.) en `types/index.ts`
- [x] Estructura de carpetas para ambas apps (`(buyer)/` y `agente/`)
- [x] Componente maestro `PropertyCard` — media canvas + overlays + footer de agenda expandible inline
- [x] Componente maestro `DayTimeSelector` — reutilizable en booking/Agenda/reagendado
- [x] Mock data ampliado a 24 propiedades (`lib/mock-data.ts`) — antes había 3, insuficiente para poblar secciones de 8
- [x] `AuthProvider` mock (`lib/auth-context.tsx`) — simula los 3 estados de sesión (invitado/comprador/agente) en memoria hasta que se elija proveedor de auth real (ver decisión abierta #2)
- [x] `Header` reutilizable con los 3 estados de rol (spec §2) — usado en Discovery/Login; rehecho según Figma real (sin campanita, chips outline, comprador con "Anunciar propiedad", ver sección "Rediseño 2026-08")
- [x] Landing Gateway (spec §3.1) — rehecho según Figma real: header minimal (solo logo + selector de idioma decorativo, sin login/anunciar), mosaico de fotos con shimmer (sin video real, ver decisión abierta #3), botones Comprar/Alquilar con filtro pre-aplicado
- [x] Login / Registro comprador (spec §3.2) — rehecho según Figma real vía `AuthSplitShell` + `FormField` compartidos (imagen 60%, campos antes del social login, ver "Rediseño 2026-08")
- [x] Login de agente (spec §4.1) — rehecho: card blanca sobre fondo oscuro, con "¿Olvidaste tu contraseña?" y botón outline a Registro
- [x] Registro de agente (`/agente/registro`) — pantalla nueva, reusa `AuthSplitShell`, campos de agencia/matrícula
- [x] Gate de `/agente` por rol (invitado→login, comprador→Acceso Restringido, agente→placeholder Dashboard) — `/agente` dejó de ser 404
- [x] `Logo`/wordmark (K verde) y `Footer` del sitio, componentes nuevos usados en Discovery/Landing
- [x] Discovery — secciones temáticas + interstitial + paginación explícita + filtro real (operación/tipo/apto crédito/búsqueda) + 2 variantes de estado vacío + toggle Grid/Mapa (Mapa es placeholder); filtros y search bar rehechos según Figma real
- [x] Quick Look modal (`PropertyQuickLookModal.tsx`) — se adelantó de esta lista, ver sección "Rediseño 2026-08" para el detalle y las limitaciones conocidas
- [x] Filtros avanzados (`AdvancedFiltersPanel.tsx` + `lib/discovery-filters.ts`) — se adelantó de esta lista, panel completo con filtrado real; falta la interpretación de texto libre → filtros (decisión abierta #8)
- [x] Mis Visitas (`MisVisitasPanel.tsx`) — se adelantó de esta lista, 3 tabs + reagendar + cancelar, ver sección "Rediseño 2026-08" para el detalle y las limitaciones conocidas
- [x] Dropdown de cuenta (`AccountDropdown.tsx`) — se adelantó de esta lista, ver sección "Rediseño 2026-08"
- [x] Drawer de Configuración (`AccountSettingsPanel.tsx`) — se adelantó de esta lista, tab "Datos personales" completa con guardado real; las otras 3 tabs (Notificaciones/Búsquedas/Privacidad) quedan como placeholder, ver sección "Rediseño 2026-08"
- [x] Dashboard Home del panel de agente (`AgentSidebar.tsx` + `AgentDashboardHome.tsx`) — reemplaza el placeholder de `/agente`; stats, Atención Requerida, Catálogo Activo y Timeline del Día con datos reales del mock (agt-4 + p25-p29), ver sección "Rediseño 2026-08" para el detalle completo de decisiones y desvíos
- [x] Pipeline de Leads (`PipelineKanban.tsx`, `/agente/pipeline`) — Kanban de 6 columnas con datos reales de `mockLeads`, búsqueda funcional; ver sección "Rediseño 2026-08"
- [x] Tu equipo (`EquipoTeam.tsx`, `/agente/equipo`) — tabla de miembros + panel de permisos/detalle con selección real; ver sección "Rediseño 2026-08" para las inconsistencias cross-frame encontradas
- [x] `agente/(panel)/layout.tsx` — gate por rol + `AgentSidebar` compartidos entre Dashboard/Pipeline/Equipo (antes vivía duplicado en cada `page.tsx`)
- [x] Propiedades (`PropertiesTable.tsx`, `/agente/propiedades`) — tabla con selección múltiple, búsqueda y paginación reales; regla de 20 días derivada (`lib/property-status.ts::getListingStatus()`) + modal "¿Sigue disponible?" (`ConfirmListingModal.tsx`), integrado con el link "Confirmar vigencia" de Atención Requerida del Dashboard Home (`?confirmar=<id>`); ver sección "Rediseño 2026-08" para el detalle completo, incluyendo el cambio retroactivo intencional al badge de p25 en el Dashboard
- [x] Agenda (`AgentAgenda.tsx`, `/agente/agenda`) — calendario semanal real (visitas ubicadas por fecha/hora real, filtros de propiedad/estado reales, confirmar/cancelar visita real) + detección real de conflictos de horario y el wizard de 3 pasos "Flujo de Resolución de Conflictos" (`ConflictResolutionModal.tsx`) + "Bloquear horario" (`BlockScheduleModal.tsx`); ver sección "Rediseño 2026-08" para el detalle completo de decisiones y desvíos. Vista "Mes" queda decorativa (sólo se construyó Semana)

### 🔲 App compradora — pendiente
- [ ] Discovery: vista Mapa real (hoy es placeholder con lista + panel "próximamente" — falta elegir proveedor: Mapbox/Google Maps/MapLibre, ver decisión abierta #5)
- [ ] Feed inmersivo (swipe + cola de similares)
- [ ] Franja de "búsqueda interpretada" + chips descartables en el estado de resultados de Discovery, y que "Búsqueda IA" del panel de filtros arme filtros de verdad a partir de texto libre (decisión abierta #8)
- [ ] Contenido real de las tabs Notificaciones / Búsquedas / Privacidad del drawer de Configuración (hoy placeholder), y pantallas de Favoritos / Búsquedas guardadas del dropdown de cuenta (también decorativos — no hay modelo de datos para ninguno de los dos todavía)
- [ ] Perfil de agente (página pública)
- [ ] Centro de notificaciones — la campanita del Header ya tiene el badge pero no abre nada todavía

### 🔲 Panel de agente — pendiente
- [ ] Timer real de 2hs en la alerta "Visita a punto de vencer" del Dashboard Home (hoy el "vence en 18 minutos" es texto fijo, no calculado desde `requestedAt`) y acciones reales de aceptar/rechazar en el Timeline del Día / alertas de Atención Requerida del Dashboard (hoy todo decorativo ahí, `title="Próximamente"` — Agenda sí tiene confirmar/cancelar reales para sus propias visitas, ver checklist de arriba)
- [ ] Drag-and-drop entre columnas del Pipeline, y que "+ Nuevo Lead"/los selects de filtro funcionen de verdad
- [ ] Backend real de permisos por agente en Equipo (hoy los 3 toggles son de solo lectura) y flujo real de "Invitar agente"/"Asignar lead"/"Asignar propiedad"/"Desactivar Agente"
- [ ] Editor de propiedad (tabs: básicos, detalles, media, disponibilidad, financiamiento, preview)
- [ ] Vista "Mes" de Agenda (hoy sólo Semana está construida)
- [ ] Marketing (4 tabs: cuentas, crear publicación, calendario, rendimiento)
- [ ] Modal de registro de contacto por WhatsApp

### 🔲 Backend / lógica de negocio — no empezado
- [ ] API routes o backend separado para `Property`, `VisitRequest`, `Lead`
- [ ] **Job de timer de 2hs** (spec §5.1) — auto-expira solicitudes pendientes sin respuesta del agente
- [ ] **Job de auto-pausa a 20 días** (spec §5.4) — hoy la regla ya está implementada como función pura derivada en el cliente (`getListingStatus()`, ver checklist de arriba), pero sigue faltando el job de backend real que la recalcule server-side y dispare notificaciones/recordatorios ("Recordarme en 3 días" del modal es decorativo todavía)
- [ ] Integración WhatsApp (deep link `wa.me` primero — ver spec §7, NO usar Business API en el MVP)
- [ ] Auth con roles (`comprador` / `agente`) y protección de rutas `agente/*`
- [ ] Integraciones Marketing: Meta Graph API (Instagram+Facebook) primero, TikTok/WhatsApp Business después

---

## Decisiones abiertas / a confirmar antes de seguir

1. **Backend**: ¿Next.js API routes + una DB (Postgres/Supabase), o un backend separado? No definido todavía — afecta cómo se estructura `lib/`.
2. **Auth**: ¿NextAuth, Clerk, o auth propio? El campo `role` en el modelo de usuario ya está pensado (spec §2) pero falta elegir el proveedor. Mientras tanto, `lib/auth-context.tsx` simula sesión en memoria (se pierde al refrescar) — al elegir proveedor, reemplazar `login`/`logout` mantiniendo la misma forma de `AuthContextValue` para no tener que tocar `Header`, `Login`, etc.
3. **Video hosting**: las propiedades usan video pesado (feed inmersivo, tarjetas) — necesita CDN/streaming (Mux, Cloudflare Stream) en vez de servir archivos directo. El mosaico del Landing y el badge "DESTACADO" de Discovery usan fotos como placeholder hasta que existan URLs de video reales.
4. **Google Fonts**: en este sandbox de desarrollo no hay acceso a fonts.googleapis.com, así que `layout.tsx` quedó con fuentes de sistema como fallback. Al conectar en un entorno con internet real, restaurar `next/font/google` para Inter + Fraunces (spec §1.4).
5. **Proveedor de mapas**: Vista Mapa (spec §3.3) necesita Mapbox, Google Maps o MapLibre para el mapa interactivo + clustering de pines — no definido todavía, hoy es un placeholder (`MapaPlaceholder` en `DiscoveryClient.tsx`).
6. **Fotos mock vía Unsplash**: `lib/mock-data.ts` usa URLs `images.unsplash.com` como placeholder (igual que las 3 propiedades originales) — funcionan en cualquier entorno con salida a internet normal, pero no cargan en este sandbox de desarrollo (dominio no permitido). No es un bug del código.
7. **Fuente de verdad de diseño**: a partir del rediseño 2026-08, el archivo real de Figma (`kasaaEstilo1`, conectado vía MCP) manda sobre `kasaa-spec-completa.md` en cuestiones de layout/composición visual — el spec sigue siendo la referencia de comportamiento, reglas de negocio y flujos. Si aparece un nuevo desvío entre ambos al construir una pantalla pendiente, resolverlo a favor del Figma y anotarlo en la sección "Rediseño 2026-08" de este archivo.
8. **Interpretación de "Búsqueda IA" (texto libre → filtros estructurados)**: el frame `desktop-discovery-ai-search` muestra un estado de Discovery donde una búsqueda en lenguaje natural (ej. "depto luminoso pet friendly cerca de parques") se traduce en una franja "Resultados para tu búsqueda" con chips descartables ("Pet Friendly", "Cerca de parques", etc.) y en el panel de Filtros avanzados los checkboxes correspondientes de "Estado de vida" quedarían tildados. El usuario eligió (cuando se preguntó) la opción "funcional con nuevos campos mock" para esto — los campos ya existen ahora (`Property.amenities`, agregados para el panel de Filtros avanzados), pero falta: (a) la franja de búsqueda interpretada en el estado de resultados de Discovery, y (b) la lógica de keywords que mapea texto libre → `amenities`/chips. El textarea "Búsqueda IA" del panel de filtros hoy solo alimenta el buscador de texto plano, no arma filtros. Próximo paso lógico cuando se retome.

---

## Convención para actualizar este archivo

Cada vez que se termine una pantalla o componente de la lista de pendientes,
moverla a la sección de "hecho" con un check, y si la implementación se
desvió de lo que dice `kasaa-spec-completa.md`, anotar el motivo acá mismo
antes de seguir — así el spec y el código no se desincronizan silenciosamente.
