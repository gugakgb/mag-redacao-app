
import { supabase } from "./supabaseClient";
import { User, UserRole, SubscriptionTier, CorrectionResult } from "../types";

// Email do Administrador Mestre
const ADMIN_EMAIL = 'gugakgb@hotmail.com';

export const authService = {
  
  // Login agora busca na nuvem com tratamento de erro melhorado
  login: async (email: string, password: string): Promise<{ user: User | null, error?: string }> => {
    try {
      // 1. Autenticar Usuário
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Log como aviso (warn) pois geralmente é erro do usuário (senha errada), não bug
        console.warn("Tentativa de login falhou:", authError.message);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, error: "Usuário não encontrado." };
      }

      // 2. Buscar dados do perfil (tabela profiles)
      const user = await authService.getUserProfile(authData.user.id);
      return { user };

    } catch (error: any) {
      console.error("Erro inesperado no login:", error);
      return { user: null, error: error.message || "Erro desconhecido" };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  // Método de Recuperação de Senha
  recoverPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redireciona de volta para o app após clicar no link
      });

      if (error) {
        console.error("Erro ao enviar recuperação:", error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Busca sessão atual + perfil + histórico
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return await authService.getUserProfile(session.user.id);
  },

  // Helper interno para montar o objeto User completo
  getUserProfile: async (userId: string): Promise<User | null> => {
    // 1. Dados do Perfil
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // RECUPERAÇÃO DE FALHA (LAZY CREATION)
    if (!profile) {
       console.log("Perfil não encontrado, tentando criar a partir dos metadados...");
       const { data: { user } } = await supabase.auth.getUser();
       
       if (user && user.id === userId) {
          const meta = user.user_metadata || {};
          
          // Verificação de Admin na recuperação
          const isAdmin = user.email === ADMIN_EMAIL;
          const role = isAdmin ? 'mentor' : (meta.role || 'student');
          const tier = isAdmin ? 'MENTOR' : (meta.tier || 'GRATUITO');
          const credits = isAdmin ? 9999 : (tier === 'GOLD' ? 40 : tier === 'PLATINUM' ? 20 : tier === 'IRON' ? 10 : 2);
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
                id: user.id,
                email: user.email,
                name: meta.name || 'Imbatível',
                instagram: meta.instagram || '',
                role: role,
                tier: tier,
                credits: credits
            }])
            .select()
            .single();

          if (insertError) {
             console.error("Falha na criação tardia do perfil:", insertError.message);
             return null;
          }
          profile = newProfile;
       } else {
         return null;
       }
    }

    // 2. Histórico de Correções
    const { data: corrections } = await supabase
      .from('corrections')
      .select('result, created_at, id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const history: CorrectionResult[] = corrections?.map(c => ({
      ...c.result,
      id: c.id,
      date: new Date(c.created_at).toLocaleDateString('pt-BR')
    })) || [];

    return {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      instagram: profile.instagram,
      role: profile.role as UserRole,
      tier: profile.tier as SubscriptionTier,
      credits: profile.credits,
      history: history
    };
  },

  // --- USER MANAGEMENT FUNCTIONS (CLOUD) ---

  getAllUsers: async (): Promise<User[]> => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Erro ao buscar usuários:", error);
        return [];
    }

    return profiles.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      instagram: p.instagram,
      role: p.role,
      tier: p.tier,
      credits: p.credits,
      history: []
    }));
  },

  updateUser: async (updatedUser: Partial<User>): Promise<boolean> => {
    console.log("Tentando atualizar usuário:", updatedUser.name, "Novo Plano:", updatedUser.tier);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        instagram: updatedUser.instagram,
        tier: updatedUser.tier,
        credits: updatedUser.credits
      })
      .eq('id', updatedUser.id);

    if (error) {
        console.error("ERRO NO UPDATE (Supabase):", error.message);
        console.error("Detalhes:", error);
        return false;
    }

    return true;
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    return !error;
  },

  registerStudent: async (name: string, email: string, password: string, instagram: string, tier: SubscriptionTier): Promise<boolean> => {
    
    // BACKDOOR LÓGICO: Detecta se é o Administrador Mestre
    const isAdmin = email === ADMIN_EMAIL;
    
    const finalRole = isAdmin ? 'mentor' : 'student';
    const finalTier = isAdmin ? 'MENTOR' : tier;
    const finalCredits = isAdmin ? 9999 : (tier === 'GOLD' ? 40 : tier === 'PLATINUM' ? 20 : tier === 'IRON' ? 10 : 2);

    // 1. Criar Auth User
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, instagram, tier: finalTier, role: finalRole } 
      }
    });

    if (error) {
        console.error("Erro cadastro auth:", error.message);
        return false;
    }

    // 2. Inserir na tabela profiles (se houver sessão imediata)
    if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: data.user.id,
            email,
            name,
            instagram,
            role: finalRole,
            tier: finalTier,
            credits: finalCredits
          }]);
        
        if (profileError) {
             console.error("Erro ao criar perfil inicial:", profileError.message);
        }
    }

    return true;
  },

  saveCorrection: async (userId: string, result: CorrectionResult): Promise<User | null> => {
    const { error: insertError } = await supabase
      .from('corrections')
      .insert([{
        user_id: userId,
        result: result
      }]);

    if (insertError) {
        console.error("Erro ao salvar correção:", insertError);
        return null;
    }

    const currentUser = await authService.getUserProfile(userId);
    
    // Mentores não gastam créditos
    if (currentUser && currentUser.role !== 'mentor') {
        const newCredits = Math.max(0, currentUser.credits - 1);
        await supabase
          .from('profiles')
          .update({ credits: newCredits })
          .eq('id', userId);
    }

    return await authService.getUserProfile(userId);
  }
};
