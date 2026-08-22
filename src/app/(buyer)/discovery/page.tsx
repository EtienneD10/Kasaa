import { Suspense } from "react";
import { DiscoveryClient } from "./DiscoveryClient";

// DiscoveryClient usa useSearchParams() (para leer ?operation= del Landing
// Gateway) — Next.js pide envolverlo en Suspense para no de-optimizar toda
// la ruta a client-only rendering.
export default function DiscoveryPage() {
  return (
    <Suspense fallback={null}>
      <DiscoveryClient />
    </Suspense>
  );
}
