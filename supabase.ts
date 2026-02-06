
import { createClient } from '@supabase/supabase-js';

// ЗАМІНИ ЦІ ЗНАЧЕННЯ НА СВОЇ З SUPABASE DASHBOARD
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
