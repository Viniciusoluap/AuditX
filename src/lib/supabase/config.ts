// Módulo isolado (sem `next/headers`) para ser seguro de importar tanto em
// Server Components/Actions quanto no middleware (Edge Runtime).
export const authConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxxxxxx");
