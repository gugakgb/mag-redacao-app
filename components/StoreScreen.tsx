import React, { useEffect, useState } from 'react';
import { Check, Crown, Zap, Shield, MessageCircle, ArrowLeft, Loader2, ExternalLink, RefreshCw, Smartphone, AlertCircle, PlayCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

interface StoreScreenProps {
  onBack: () => void;
}

// LINKS DE PAGAMENTO CONFIGURADOS (KIWIFY)
const PAYMENT_LINKS = {
    IRON: "https://pay.kiwify.com.br/t5Ap7Mg", 
    PLATINUM: "https://pay.kiwify.com.br/MlhtpJj",
    GOLD: "https://pay.kiwify.com.br/yUzcFtx"
};

const StoreScreen: React.FC<StoreScreenProps> = ({ onBack }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para lembrar qual plano o aluno tentou comprar
  const [pendingPlan, setPendingPlan] = useState<'IRON' | 'PLATINUM' | 'GOLD' | null>(null);

  useEffect(() => {
      loadUser();
      
      // RECUPERAÇÃO TÁTICA: Verifica se havia um plano pendente na memória do navegador
      const savedPlan = localStorage.getItem('mag_pending_plan');
      if (savedPlan) {
          setPendingPlan(savedPlan as 'IRON' | 'PLATINUM' | 'GOLD');
      }
  }, []);

  const loadUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      setLoading(false);
  };
  
  const handlePurchase = (plan: 'IRON' | 'PLATINUM' | 'GOLD') => {
    if (!currentUser) return;

    setPendingPlan(plan);
    // MEMÓRIA DE COMBATE: Salva o plano no navegador para não perder a informação se a página recarregar
    localStorage.setItem('mag_pending_plan', plan);

    const baseUrl = PAYMENT_LINKS[plan];
    const checkoutUrl = `${baseUrl}?email=${encodeURIComponent(currentUser.email)}`;
    
    // Abre o checkout
    window.open(checkoutUrl, '_blank');
  };

  const handleSendProof = () => {
      const planName = pendingPlan ? pendingPlan : "VARIADO";
      
      // Mensagem Tática Formatada
      const text = `💀 *COMANDO MAG* 💀\n\nOlá Mentor! Sou o aluno *${currentUser?.name || 'Imbatível'}*.\n\nAcabei de adquirir o plano *${planName}*.\nSegue meu comprovante para liberação imediata dos créditos.`;
      
      const baseUrl = "https://wa.me/message/TY7LCCWSM73UN1";
      const url = `${baseUrl}?text=${encodeURIComponent(text)}`;
      
      // Limpa a memória após enviar
      localStorage.removeItem('mag_pending_plan');
      setPendingPlan(null);
      
      window.open(url, '_blank');
  };

  const handleSupport = () => {
      const text = "Olá! Tenho dúvidas sobre os planos e funcionamento do MAG Redação.";
      const baseUrl = "https://wa.me/message/TY7LCCWSM73UN1";
      const url = `${baseUrl}?text=${encodeURIComponent(text)}`;
      
      window.open(url, '_blank');
  };

  if (loading) {
      return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500" /></div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-12">
      <div className="text-center mb-8 pt-4">
        <button 
          onClick={onBack} 
          className="mb-6 flex items-center justify-center mx-auto text-sm text-slate-500 hover:text-slate-800 transition gap-1"
        >
          <ArrowLeft size={16} /> Voltar para o Corretor
        </button>
        <h2 className="text-3xl font-bold text-slate-900 mb-3">Pacotes de Correção</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Invista na sua aprovação. Escolha o plano ideal para PMMG.
        </p>
      </div>

      {/* ÁREA DE STATUS / INSTRUÇÃO DE LIBERAÇÃO */}
      <div className="max-w-3xl mx-auto mb-10 bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden group">
         {/* Background Effect */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-yellow-500/20 transition duration-700"></div>

         <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
            <Zap className="text-yellow-500" size={20} /> Como funciona a liberação?
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center mb-2">1</div>
                <span className="text-slate-300 text-sm">Escolha seu plano abaixo e faça o pagamento seguro.</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center mb-2">2</div>
                <span className="text-slate-300 text-sm">Clique no botão verde para enviar o comprovante.</span>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-green-900 text-green-400 font-bold flex items-center justify-center mb-2"><Check size={16} /></div>
                <span className="text-slate-300 text-sm">O Mentor libera seus créditos imediatamente.</span>
            </div>
         </div>

         {/* BOTÃO DE AÇÃO PRINCIPAL */}
         <div className="mt-6 flex justify-center">
            <button 
                onClick={handleSendProof}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-900/50 transition transform hover:scale-105 flex items-center gap-2 border border-green-500/50 animate-pulse hover:animate-none"
            >
                <Smartphone size={20} />
                {pendingPlan ? `Já paguei o Plano ${pendingPlan}, liberar agora` : "Já fiz o pagamento, liberar agora"}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        
        {/* IRON PLAN */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition hover:-translate-y-1 relative group">
          <div className="p-8 flex-grow">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-slate-400" size={24} />
              <h3 className="text-xl font-bold text-slate-700">Pacote IRON</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">R$ 49</span>
              <span className="text-slate-400 text-sm">/único</span>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-medium">Ideal para revisões finais.</p>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="flex items-center gap-3">
                <div className="bg-green-100 p-1 rounded-full"><Check size={12} className="text-green-600" /></div> 
                <span className="font-bold">10 Correções de Redação</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-full"><Check size={12} className="text-slate-400" /></div> 
                <span>Análise Completa da IA</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1 rounded-full"><Check size={12} className="text-yellow-600" /></div> 
                <span>Banco de Temas Focados (CRS)</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={() => handlePurchase('IRON')}
              className="w-full py-3 rounded-xl border-2 border-slate-800 text-slate-800 font-bold hover:bg-slate-800 hover:text-white transition flex items-center justify-center gap-2"
            >
              Comprar Iron <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* PLATINUM PLAN */}
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden flex flex-col transform md:-translate-y-4 relative group">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-400 to-cyan-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
            MELHOR CUSTO-BENEFÍCIO
          </div>
          <div className="p-8 flex-grow">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-cyan-400" size={24} />
              <h3 className="text-xl font-bold text-white">Pacote PLATINUM</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">R$ 79</span>
              <span className="text-slate-400 text-sm">/único</span>
            </div>
            <p className="text-sm text-slate-400 mb-6 font-medium">Para uma preparação consistente.</p>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <div className="bg-cyan-900 p-1 rounded-full"><Check size={12} className="text-cyan-400" /></div> 
                <span className="font-bold text-white">20 Correções de Redação</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-cyan-900 p-1 rounded-full"><Check size={12} className="text-cyan-400" /></div> 
                <span className="font-bold text-white">Acesso à Versão Ideal MAG CRS</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-1 rounded-full"><Check size={12} className="text-slate-400" /></div> 
                <span>Análise Completa da IA</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-1 rounded-full"><Check size={12} className="text-slate-400" /></div> 
                <span>Banco de Temas Focados (CRS)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-800 p-1 rounded-full"><Check size={12} className="text-slate-400" /></div> 
                <span>Simulado com Cronômetro</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-slate-800 border-t border-slate-700">
            <button 
              onClick={() => handlePurchase('PLATINUM')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/20 transition flex items-center justify-center gap-2"
            >
              Comprar Platinum <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* GOLD PLAN */}
        <div className="bg-gradient-to-b from-yellow-50 to-white rounded-2xl shadow-lg border border-yellow-200 overflow-hidden flex flex-col hover:border-yellow-300 transition hover:-translate-y-1 relative group">
           <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400"></div>
          <div className="p-8 flex-grow">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="text-yellow-600" size={24} />
              <h3 className="text-xl font-bold text-yellow-800">Pacote GOLD</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-slate-900">R$ 119</span>
              <span className="text-slate-400 text-sm">/único</span>
            </div>
            <p className="text-sm text-yellow-700/80 mb-6 font-medium">Para treino intensivo.</p>
            <ul className="space-y-4 text-sm text-slate-700">
              <li className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1 rounded-full"><Check size={12} className="text-yellow-600" /></div> 
                <span className="font-bold">40 Correções de Redação</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1 rounded-full"><Check size={12} className="text-yellow-600" /></div> 
                <span className="font-bold">Acesso à Versão Ideal MAG CRS</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-full"><Check size={12} className="text-slate-400" /></div> 
                <span>Prioridade na Análise IA</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1 rounded-full"><Check size={12} className="text-yellow-600" /></div> 
                <span>Banco de Temas Exclusivos</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-yellow-100 p-1 rounded-full"><Check size={12} className="text-yellow-600" /></div> 
                <span>Correção de Fotos e Manuscritos</span>
              </li>
            </ul>
          </div>
          <div className="p-6 bg-yellow-50/50 border-t border-yellow-100">
            <button 
              onClick={() => handlePurchase('GOLD')}
              className="w-full py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 transition flex items-center justify-center gap-2"
            >
              Quero ser GOLD <ExternalLink size={16} />
            </button>
          </div>
        </div>

      </div>

      <div className="mt-12 text-center">
        <button 
            onClick={handleSupport}
            className="inline-flex items-center gap-2 text-slate-500 text-sm hover:text-slate-800 transition bg-slate-100 px-4 py-2 rounded-full hover:bg-slate-200"
        >
           <MessageCircle size={16} className="text-green-500" />
           <span>Dúvidas? Fale com a equipe MAG no WhatsApp</span>
        </button>
      </div>
    </div>
  );
};

export default StoreScreen;