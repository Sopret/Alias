
import { createClient } from '@supabase/supabase-js';

// ЗАМІНИ ЦІ ЗНАЧЕННЯ НА СВОЇ З SUPABASE DASHBOARD
const SUPABASE_URL = 'https://yqpjhrmybldqqjnozgpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcGpocm15YmxkcXFqbm96Z3B4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNzMwOTcsImV4cCI6MjA4NTY0OTA5N30.ZmhzTlU0Ps7BW9aCv0l_YgwR3LTwfQU-1O_F6p2PV78';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
