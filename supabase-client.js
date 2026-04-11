console.log("[Supabase] Iniciando conexión con las claves proporcionadas...");
const SUPABASE_URL = 'https://nwlqamwemzhyfsskwbmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHFhbXdlbXpoeWZzc2t3Ym1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjQ4NDQsImV4cCI6MjA5MTI0MDg0NH0.9oQoFOkTsI2h6xLkwsTz-GapOlR-HM0ZKj2u-YZDI6c';

window.MiSupabase = null;

try {
  if (typeof window.supabase !== 'undefined') {
    window.MiSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("[Supabase] Cliente inicializado correctamente.");
  } else {
    console.error("[Supabase] ERROR: No se pudo cargar la librería externa de supabase. Revisa tu conexión a internet o tu bloqueador de anuncios.");
    alert("¡Ayuda técnica! Parece que la librería de conexión externa está siendo bloqueada por tu navegador o AdBlocker.");
  }
} catch (error) {
  console.error("[Supabase] Excepción inicializando cliente:", error);
}
