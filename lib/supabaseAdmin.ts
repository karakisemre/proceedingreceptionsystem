import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = () => {
  return createClient(
    process.env.SUPABASE_URL!,                 // public olanla aynı URL olabilir
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // SADECE server’da!
    { auth: { persistSession: false } }
  );
};
