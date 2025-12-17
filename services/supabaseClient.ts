
import { createClient } from '@supabase/supabase-js';

// Imbatível, essas chaves conectam seu App ao Banco de Dados na Nuvem.
const SUPABASE_URL = 'https://soihukzepbpwpcqgnsie.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaWh1a3plcGJwd3BjcWduc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjIwNzMsImV4cCI6MjA4MTQ5ODA3M30.kUTnWkZtbO6MAdaOh5WF2HaKmlqTU65vHYryJnQ4tL4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
