
import { supabase } from "./supabaseClient";
import { Theme } from "../types";

// BACKUP TÁTICO: Caso o banco esteja vazio ou sem conexão inicial
const FALLBACK_THEMES: Theme[] = [
  { id: '1', category: 'Segurança', title: 'O uso de câmeras corporais na atividade policial', description: 'Impactos na transparência e segurança jurídica.', difficulty: 'Médio' },
  { id: '2', category: 'Sociedade', title: 'A violência doméstica e o papel da Polícia Militar', description: 'Eficácia das medidas protetivas e a atuação da PPVD.', difficulty: 'Fácil' },
  { id: '3', category: 'Tecnologia', title: 'Crimes cibernéticos e os desafios da investigação', description: 'Adaptação das forças de segurança aos delitos virtuais.', difficulty: 'Médio' },
  { id: '4', category: 'Polícia', title: 'A militarização da segurança pública: necessidade ou excesso?', description: 'O modelo de policiamento ostensivo no contexto atual.', difficulty: 'Difícil' },
  { id: '5', category: 'Sociedade', title: 'O impacto das Fake News na democracia', description: 'Desinformação como vetor de instabilidade social.', difficulty: 'Médio' },
  { id: '6', category: 'Direito', title: 'Abuso de autoridade x Estrito cumprimento do dever legal', description: 'Limites da ação policial vigorosa.', difficulty: 'Difícil' },
  { id: '7', category: 'Polícia', title: 'Polícia Comunitária: aproximação Estado e sociedade', description: 'Confiança mútua para prevenção criminal.', difficulty: 'Fácil' },
  { id: '8', category: 'Segurança', title: 'O sistema prisional brasileiro e a reincidência criminal', description: 'O papel das polícias na fiscalização de egressos.', difficulty: 'Médio' },
  { id: '9', category: 'Direito', title: 'A redução da maioridade penal: solução ou ilusão?', description: 'Impactos na segurança pública e no sistema socioeducativo.', difficulty: 'Difícil' },
  { id: '10', category: 'Sociedade', title: 'Racismo estrutural e a abordagem policial', description: 'Desafios para uma atuação isenta e técnica.', difficulty: 'Difícil' },
  { id: '11', category: 'Tecnologia', title: 'Inteligência Artificial preditiva no combate ao crime', description: 'O uso de dados para antecipar manchas criminais.', difficulty: 'Médio' },
  { id: '12', category: 'Polícia', title: 'Saúde mental dos profissionais de segurança pública', description: 'O alto índice de suicídio e estresse na tropa.', difficulty: 'Médio' },
  { id: '13', category: 'Segurança', title: 'Porte de armas para o cidadão comum', description: 'Direito de defesa vs. aumento da violência letal.', difficulty: 'Difícil' },
  { id: '14', category: 'Sociedade', title: 'A criminalidade no ambiente escolar', description: 'O papel da Patrulha Escolar na prevenção de massacres.', difficulty: 'Fácil' },
  { id: '15', category: 'Direito', title: 'Audiência de custódia e a sensação de impunidade', description: 'Garantia de direitos fundamentais ou "porta giratória"?', difficulty: 'Médio' },
  { id: '16', category: 'Polícia', title: 'A importância da hierarquia e disciplina na PMMG', description: 'Pilares institucionais em uma sociedade moderna.', difficulty: 'Fácil' },
  { id: '17', category: 'Tecnologia', title: 'Reconhecimento facial na segurança pública', description: 'Eficácia na captura de foragidos vs. privacidade.', difficulty: 'Médio' },
  { id: '18', category: 'Segurança', title: 'Tráfico de drogas e o domínio de territórios', description: 'Desafios do Estado na retomada de comunidades.', difficulty: 'Difícil' },
  { id: '19', category: 'Sociedade', title: 'População em situação de rua e a ordem pública', description: 'O papel da PM na assistência social e segurança.', difficulty: 'Médio' },
  { id: '20', category: 'Direito', title: 'Lei Maria da Penha: avanços e desafios', description: 'A evolução legislativa no combate ao feminicídio.', difficulty: 'Fácil' }
];

export const themeService = {
  
  getThemes: async (): Promise<Theme[]> => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        console.warn("Usando temas de backup (Banco vazio ou erro):", error?.message);
        return FALLBACK_THEMES;
      }

      return data as Theme[];
    } catch (e) {
      return FALLBACK_THEMES;
    }
  },

  addTheme: async (theme: Theme): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('themes')
        .insert([{
          title: theme.title,
          category: theme.category,
          description: theme.description,
          difficulty: theme.difficulty
        }]);

      if (error) {
        console.error("Erro ao adicionar tema:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  deleteTheme: async (themeId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) return false;
      return true;
    } catch (e) {
      return false;
    }
  }
};
