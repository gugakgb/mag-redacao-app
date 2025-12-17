
export interface CorrectionError {
  score: number;
  errors: string[];
}

export interface ContentFeedback {
  score: number;
  feedback: string;
}

export interface Penalties {
  titulo_ausente: boolean;
  palavras_faltantes: number;
  total_deducao: number;
}

export interface HandwritingAnalysis {
  nota: number; // 0 a 10
  feedback: string;
}

export interface CorrectionResult {
  id?: string; // Identificador único
  date?: string; // Data da correção
  theme?: string; // Tema da redação
  transcricao: string;
  contagem_palavras_ia: number;
  ortografia: CorrectionError;
  morfossintaxe: CorrectionError;
  pontuacao: CorrectionError;
  conteudo: ContentFeedback;
  penalidades: Penalties;
  legibilidade?: HandwritingAnalysis; // Novo campo opcional
  nota_final: number;
  dica_pestana: string;
  versao_ideal: string; // Novo campo: Redação reescrita nota 1000
}

export interface Theme {
  id?: string;
  category: 'Segurança' | 'Sociedade' | 'Direito' | 'Tecnologia' | 'Polícia';
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

export type InputMode = 'text' | 'pdf';

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

// Auth Types
export type UserRole = 'student' | 'mentor';

export type SubscriptionTier = 'GOLD' | 'PLATINUM' | 'IRON' | 'GRATUITO' | 'MENTOR';

export interface User {
  id: string;
  name: string;
  email: string;
  instagram?: string; 
  role: UserRole;
  tier: SubscriptionTier;
  credits: number; // Quantidade de correções disponíveis
  history: CorrectionResult[]; // Histórico de correções
}
