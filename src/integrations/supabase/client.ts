import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jxuaalmmznbtaxmnnrsc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_6PxTzfd99YAdwPsYcXyhbw_RDZ9_921";

// Tipos das tabelas são gerenciados manualmente em database-types.ts.
// Usamos `any` no generic do client porque as tabelas usam PascalCase
// e ainda não geramos types via Supabase CLI.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
