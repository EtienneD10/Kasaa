import Link from "next/link";

/**
 * Footer del sitio — no existía en la versión anterior. Reconstruido del
 * frame `footer` en Figma (dentro de `desktop-discovery-default-cards`).
 * Nota: el archivo de Figma tiene el copy de marca como "Hogar" (parece
 * texto de un template base que no se terminó de renombrar) — acá va
 * "Kasaa", consistente con el resto del producto y kasaa-spec-completa.md.
 * Todos los links son decorativos por ahora (no hay páginas de Nosotros/
 * Contacto/Blog/etc. todavía).
 */
const LINK_COLUMNS = [
  {
    heading: "Buscar",
    links: ["Comprar", "Alquilar", "Agentes", "Zonas"],
  },
  {
    heading: "Empresa",
    links: ["Nosotros", "Contacto", "Blog", "Prensa"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-buyer-border bg-buyer-surface">
      <div className="mx-auto max-w-7xl px-8 py-16">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="max-w-sm">
            <p className="font-display text-2xl font-semibold text-buyer-text">
              <span className="text-accent">k</span>asaa
            </p>
            <p className="mt-3 text-sm leading-relaxed text-buyer-text-muted">
              La plataforma inmobiliaria de nueva generación. Encontrá, visitá
              y adquirí tu próximo hogar con tecnología 3D y asistencia
              inteligente.
            </p>
          </div>

          <div className="flex gap-16">
            {LINK_COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-buyer-text">
                  {col.heading}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        title="Próximamente"
                        className="text-sm text-buyer-text-muted hover:text-buyer-text"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-buyer-border pt-6 text-xs text-buyer-text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kasaa Tecnologías Inmobiliarias S.L. Todos los derechos reservados.</p>
          <p>Privacidad · Condiciones de Uso · Cookies</p>
        </div>
      </div>
    </footer>
  );
}
