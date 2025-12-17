
import { GoogleGenAI, Type } from "@google/genai";
import { CorrectionResult } from "../types";

// Função segura para ler a chave da API em ambientes Vite/Vercel
const getApiKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GOOGLE_API_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    // @ts-ignore
    return process.env.API_KEY;
  }
  return '';
};

// Schema definition for the JSON response
const correctionSchema = {
  type: Type.OBJECT,
  properties: {
    transcricao: { type: Type.STRING, description: "Transcription of the essay if image/pdf, or the original text." },
    contagem_palavras_ia: { type: Type.INTEGER, description: "Accurate word count calculated by AI." },
    ortografia: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        errors: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    morfossintaxe: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        errors: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    pontuacao: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        errors: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    conteudo: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        feedback: { type: Type.STRING, description: "Detailed mentorship feedback." }
      }
    },
    penalidades: {
      type: Type.OBJECT,
      properties: {
        titulo_ausente: { type: Type.BOOLEAN },
        palavras_faltantes: { type: Type.NUMBER },
        total_deducao: { type: Type.NUMBER }
      }
    },
    legibilidade: {
        type: Type.OBJECT,
        nullable: true,
        description: "Only used if image/pdf provided. Evaluates handwriting legibility.",
        properties: {
            nota: { type: Type.NUMBER, description: "0 to 10 score for visual aspect/legibility" },
            feedback: { type: Type.STRING, description: "Constructive feedback on handwriting." }
        }
    },
    nota_final: { type: Type.NUMBER },
    dica_pestana: { type: Type.STRING, description: "A specific grammar tip based on the work of Fernando Pestana." },
    versao_ideal: { type: Type.STRING, description: "A rewritten version of the student's essay (or key paragraphs) fixing errors and improving vocabulary to achieve a perfect 100 score, keeping the original thesis." }
  }
};

export const correctEssay = async (
  theme: string,
  title: string,
  text: string,
  fileData: { base64: string; mimeType: string } | null
): Promise<CorrectionResult> => {
  
  const apiKey = getApiKey();
  
  // Se não houver chave no ambiente, tenta ler do LocalStorage (configuração manual do usuário)
  // ou lança erro se não encontrar nada.
  const finalKey = apiKey || localStorage.getItem('gemini_api_key');

  if (!finalKey) {
      throw new Error("Chave de API não configurada. Verifique o VITE_GOOGLE_API_KEY na Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey: finalKey });

  const systemPrompt = `
    Você é um MENTOR especialista em neurociência e aprovação em concursos públicos (Carreira Policial).
    Seu tom é motivador, didático, inteligente e interativo.
    Você chama o aluno sempre de "Imbatível". Ex: "Imbatível, observe que..."
    
    Você está corrigindo uma redação para o CFO PMMG (Edital DRH/CRS Nº 11/2025).
    
    **CRITÉRIOS DE CORREÇÃO (100 pts):**
    1. Ortografia (20 pts): Acentos, grafia, maiúsculas. (-1 por erro).
    2. Morfossintaxe (20 pts): Concordância, regência, crase, colocação. (-1 por erro).
    3. Pontuação (20 pts): Vírgulas, pontos. (-1 por erro).
    4. Conteúdo (40 pts): Pertinência (8), Argumentação (8), Coesão (8), Parágrafos (8), Vocabulário (8).
    
    **PENALIDADES:** Título ausente (-1), <120 palavras (-1/palavra), >30 linhas (-5/linha).
    
    **ATENÇÃO ESPECIAL (IMAGENS/PDF):**
    Se o aluno enviou uma imagem, você DEVE avaliar a CALIGRAFIA (Legibilidade).
    - A letra está legível? Os traços são firmes?
    - Há rasuras excessivas?
    - Atribua uma nota de 0 a 10 para o quesito "Visual/Legibilidade" e dê um conselho prático no campo 'legibilidade'.
    - Se for texto digitado, retorne 'legibilidade' como null.

    **VERSÃO IDEAL (Neuroaprendizagem):**
    Além de corrigir, você deve reescrever o texto do aluno (ou os parágrafos problemáticos) criando uma "Versão de Referência (Nota 100)".
    - Mantenha a ideia central do aluno, mas corrija todos os erros gramaticais.
    - Eleve o vocabulário (use conectivos coesivos fortes).
    - Melhore a estrutura argumentativa.
    - O objetivo é que o aluno compare o texto dele com essa versão para aprender por modelagem.
    
    **INPUT DO ALUNO:**
    Tema: ${theme || "Livre"}
    Título: ${title || "Sem título"}
  `;

  const parts = [];
  
  // Add file if exists, otherwise text
  if (fileData) {
    parts.push({
      text: "Transcreva o arquivo anexado (imagem ou PDF) fielmente. Depois, avalie a CALIGRAFIA/LEGIBILIDADE visualmente. Por fim, corrija o texto transcrito conforme as regras gramaticais e de conteúdo."
    });
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.base64
      }
    });
  } else {
    parts.push({
      text: `**REDAÇÃO DO ALUNO (DIGITADA):**\n${text}`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using standard flash for speed and quality combination
      contents: {
        role: "user",
        parts: [...parts, { text: systemPrompt }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: correctionSchema,
        temperature: 0.4, // Lower temperature for more consistent grading
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("A IA não retornou texto. Verifique sua conexão ou a Chave de API.");
    
    // TÁTICA DE LIMPEZA: Remove blocos de código Markdown se a IA os incluir
    const cleanedText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

    try {
        return JSON.parse(cleanedText) as CorrectionResult;
    } catch (parseError) {
        console.error("Erro ao processar JSON:", cleanedText);
        throw new Error("Falha ao processar a resposta da IA. Tente novamente.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Tratamento de erros comuns para feedback ao usuário
    if (error.message && (error.message.includes("API key") || error.message.includes("403"))) {
        throw new Error("Erro de Autenticação: Verifique a VITE_GOOGLE_API_KEY na Vercel.");
    }
    
    throw error;
  }
};
