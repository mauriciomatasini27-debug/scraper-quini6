/**
 * Cliente Supabase para el Frontend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Aceptar tanto NEXT_PUBLIC_SUPABASE_ANON_KEY como NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verificar si las variables están configuradas
const isConfigured = supabaseUrl && supabaseAnonKey && 
                    supabaseUrl !== '' && 
                    supabaseAnonKey !== '' &&
                    !supabaseUrl.includes('tu-proyecto') &&
                    !supabaseAnonKey.includes('tu_clave') &&
                    !supabaseUrl.includes('placeholder');

// Crear cliente solo si está configurado, de lo contrario crear uno dummy
let supabase: SupabaseClient;

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Crear cliente dummy para evitar errores de compilación
  // Las consultas fallarán pero al menos la app no se romperá
  supabase = createClient(
    'https://placeholder.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  );
  
  // Mostrar error en consola del navegador
  if (typeof window !== 'undefined') {
    console.error(
      '%c❌ ERROR: Variables de entorno de Supabase no configuradas',
      'color: red; font-size: 16px; font-weight: bold;'
    );
    console.error(
      '\nPor favor, crea un archivo .env.local en la raíz del proyecto con:\n\n' +
      'NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co\n' +
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_clave_aqui\n' +
      '(o NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui)\n\n' +
      'Ver CONFIGURAR_SUPABASE_FRONTEND.md para más detalles.'
    );
  }
}

export { supabase };
export const isSupabaseConfigured = isConfigured;

