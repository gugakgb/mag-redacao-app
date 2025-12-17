
import { createClient } from '@supabase/supabase-js';

// Imbatível, aqui está a configuração BLINDADA para conexão com o Supabase.
// Este arquivo está pronto para ir para o GitHub e Vercel sem quebrar o build.

// Função auxiliar para ler variáveis de ambiente de forma segura em qualquer ambiente (Vite ou Node)
const getEnvVar = (key: string): string => {
    try {
        // 1. Tenta ler do Vite (import.meta.env)
        // Usamos 'as any' para evitar erros de tipagem se o compilador não reconhecer o Vite
        if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
            const value = (import.meta as any).env[key];
            if (value) return value;
        }
        
        // 2. Tenta ler do Node/Process (process.env) - Fallback para compatibilidade
        if (typeof process !== 'undefined' && process.env) {
            const value = process.env[key];
            if (value) return value;
        }
    } catch (error) {
        console.warn(`Erro tático ao ler variável de ambiente ${key}:`, error);
    }
    return '';
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validação Tática: Apenas alerta no console, não trava a aplicação
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ ALERTA DO MENTOR: As chaves do Supabase não foram detectadas.");
    console.warn("Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no .env ou na Vercel.");
}

// Cria o cliente com valores reais ou placeholders para evitar crash fatal na inicialização.
// Se as chaves faltarem, o app abre, mas as requisições falham (tratado no authService).
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder-url.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder-key'
);
