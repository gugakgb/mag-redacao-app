
import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Keyboard, 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  Gavel, 
  Wand2, 
  Loader2, 
  FileBox, 
  Brain, 
  SpellCheck, 
  Type, 
  PenTool, 
  Lightbulb, 
  LogOut, 
  Users, 
  LayoutDashboard, 
  Crown, 
  PlusCircle, 
  Clock, 
  Lock, 
  Star, 
  BarChart2, 
  Feather, 
  BookOpen, 
  Sparkles, 
  Timer as TimerIcon, 
  Home, 
  Menu,
  Shield
} from 'lucide-react';

import ScoreHero from './components/ScoreHero';
import FeedbackCard from './components/FeedbackCard';
import LoginScreen from './components/LoginScreen';
import MentorDashboard from './components/MentorDashboard';
import StoreScreen from './components/StoreScreen';
import HistoryScreen from './components/HistoryScreen';
import StudentDashboard from './components/StudentDashboard';
import ThemeSelector from './components/ThemeSelector';
import TimerWidget from './components/TimerWidget'; 
import { correctEssay } from './services/geminiService';
import { authService } from './services/authService';
import { CorrectionResult, InputMode, AnalysisStatus, User } from './types';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  // App State - Inicializa no Dashboard conforme solicitado
  const [view, setView] = useState<'app' | 'admin' | 'store' | 'history' | 'dashboard'>('dashboard');

  const [mode, setMode] = useState<InputMode>('text');
  const [showPdfWarning, setShowPdfWarning] = useState(false); 
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false); 
  const [showIdealVersion, setShowIdealVersion] = useState(false); 

  const [theme, setTheme] = useState('');
  const [title, setTitle] = useState('');
  const [essayText, setEssayText] = useState('');
  const [essayFile, setEssayFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Check login on load
  useEffect(() => {
    const initAuth = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user) setCurrentUser(user);
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            setLoadingAuth(false);
        }
    };
    initAuth();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setView('dashboard'); // Reseta view padrão
    setResult(null);
  };

  // Função para resetar o corretor e abrir a tela limpa
  const handleResetCorrector = () => {
    setView('app');
    setStatus(AnalysisStatus.IDLE);
    setResult(null);
    setEssayText('');
    setTheme('');
    setTitle('');
    setEssayFile(null);
    setShowIdealVersion(false);
    setIsSimulationMode(false);
    setErrorMessage('');
    setShowPdfWarning(false);
  };

  const handleModeSwitch = (newMode: InputMode) => {
    if (newMode === 'pdf') {
        if (currentUser?.tier === 'GRATUITO') {
            setShowPremiumModal(true);
            return;
        }
        setShowPdfWarning(true);
    } else {
        setMode('text');
    }
  };

  // Logica para Sugerir Tema (Restrito a Pagos)
  const handleSuggestTheme = () => {
    if (currentUser?.tier === 'GRATUITO') {
      setShowPremiumModal(true);
    } else {
      setShowThemeSelector(true);
    }
  };

  // Lógica para Versão Ideal (Restrito a Gold e Platinum)
  const handleToggleIdealView = (shouldShow: boolean) => {
      if (!shouldShow) {
          setShowIdealVersion(false);
          return;
      }

      // Verifica tiers permitidos (MENTOR, GOLD, PLATINUM)
      const allowedTiers = ['MENTOR', 'GOLD', 'PLATINUM'];
      const userTier = currentUser?.tier || 'GRATUITO';

      if (allowedTiers.includes(userTier)) {
          setShowIdealVersion(true);
      } else {
          setShowPremiumModal(true);
      }
  };

  const confirmPdfMode = () => {
      setMode('pdf');
      setShowPdfWarning(false);
  };

  const handleWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEssayFile(e.target.files[0]);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleCorrection = async () => {
    if (mode === 'text' && !essayText.trim()) {
      alert("Por favor, digite sua redação.");
      return;
    }

    if (mode === 'pdf' && !essayFile) {
      alert("Por favor, envie uma foto ou PDF.");
      return;
    }

    if (currentUser && currentUser.credits <= 0) {
      alert("Você atingiu o limite do seu plano. Adquira mais correções para continuar evoluindo!");
      setView('store');
      return;
    }

    setStatus(AnalysisStatus.LOADING);
    setErrorMessage('');
    setResult(null);
    setIsSimulationMode(false);
    setShowIdealVersion(false); 

    try {
      let fileData: { base64: string; mimeType: string } | null = null;
      if (mode === 'pdf' && essayFile) {
        const base64 = await convertFileToBase64(essayFile);
        fileData = {
          base64: base64,
          mimeType: essayFile.type
        };
      }

      const data = await correctEssay(theme, title, essayText, fileData);
      
      const enrichedData: CorrectionResult = {
        ...data,
        id: crypto.randomUUID(), 
        date: new Date().toLocaleDateString('pt-BR'),
        theme: theme || "Tema Livre"
      };

      if (currentUser) {
        const updatedUser = await authService.saveCorrection(currentUser.id, enrichedData);
        if (updatedUser) {
          setCurrentUser(updatedUser);
        }
      }

      setResult(enrichedData);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
      setErrorMessage("Ocorreu um erro ao corrigir a redação. Tente novamente.");
    }
  };

  const handleSelectHistoryItem = (item: CorrectionResult) => {
    setResult(item);
    setStatus(AnalysisStatus.SUCCESS);
    setView('app');
    setTheme(item.theme || '');
    if (item.transcricao) setEssayText(item.transcricao);
    setShowIdealVersion(false);
  };

  const handleThemeSelection = (selectedTheme: string) => {
    setTheme(selectedTheme);
    if (!title) setTitle(selectedTheme);
  };

  if (loadingAuth) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <Loader2 size={40} className="animate-spin text-yellow-500" />
          </div>
      );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 relative">
      
      {isSimulationMode && <TimerWidget onExpire={() => alert("Tempo esgotado, Imbatível! Envie sua redação agora.")} />}

      <ThemeSelector 
        isOpen={showThemeSelector} 
        onClose={() => setShowThemeSelector(false)} 
        onSelect={handleThemeSelection} 
      />

      {/* PREMIUM LOCK MODAL */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform scale-100 relative">
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <AlertTriangle size={20} className="hidden" /> 
                  <span className="text-2xl">&times;</span>
                </button>

                <div className="bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-yellow-500 p-3 rounded-full mb-3 shadow-lg shadow-yellow-500/30">
                        <Lock size={32} className="text-slate-900" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Funcionalidade Premium</h3>
                    <p className="text-yellow-500 text-xs font-bold tracking-widest uppercase mt-1">Nível Platinum ou Gold</p>
                </div>
                
                <div className="p-6 text-center space-y-4">
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Imbatível, para acessar a <strong>Versão Ideal MAG CRS</strong> e comparar com seu texto, você precisa ser um aluno de elite.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> 
                            <strong>Versão Ideal MAG CRS (Reescrita)</strong>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> 
                            <strong>Banco de Temas Quentes</strong>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <CheckCircle size={16} className="text-green-500" /> 
                            <strong>Correção de Fotos (Apenas Gold)</strong>
                        </div>
                    </div>
                    <button 
                       onClick={() => { setShowPremiumModal(false); setView('store'); }}
                       className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-yellow-500/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                       <Crown size={18} /> Fazer Upgrade Agora
                    </button>
                    <button 
                       onClick={() => setShowPremiumModal(false)}
                       className="text-xs text-slate-400 font-medium hover:text-slate-600"
                    >
                       Voltar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* PDF WARNING MODAL */}
      {showPdfWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100">
                <div className="bg-yellow-500 p-4 flex justify-center">
                    <AlertTriangle size={48} className="text-white" />
                </div>
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Atenção, Imbatível!</h3>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                        Para garantir uma correção precisa e justa, é fundamental que a foto ou PDF da sua redação esteja com 
                        <span className="font-bold text-slate-800"> alta resolução</span> e 
                        <span className="font-bold text-slate-800"> letra legível</span>.
                    </p>
                    <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mb-6">
                        Imagens borradas ou ilegíveis podem resultar em uma análise incorreta da Inteligência Artificial.
                    </p>
                    <div className="flex gap-3">
                        <button 
                           onClick={() => setShowPdfWarning(false)}
                           className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition"
                        >
                           Cancelar
                        </button>
                        <button 
                           onClick={confirmPdfMode}
                           className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition"
                        >
                           Entendi, prosseguir
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* HEADER WITH NAVIGATION MENU */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* 1. Logo & Identity */}
            <div className="flex items-center justify-between w-full lg:w-auto">
                <div className="flex items-center space-x-4">
                    <div 
                    onClick={() => setView('dashboard')}
                    className="cursor-pointer hover:opacity-80 transition"
                    >
                         {/* Minimalist Header Logo */}
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-md relative group border border-yellow-300/30">
                            <Shield size={20} className="text-slate-900" fill="currentColor" fillOpacity={0.2} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                <Crown size={8} className="text-slate-900 -mb-0.5" fill="currentColor" />
                                <span className="text-[10px] font-black text-slate-900 tracking-tighter">MAG</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-wide leading-tight hidden sm:block">MAG Redação PMMG</h1>
                        <h1 className="text-lg font-bold tracking-wide leading-tight block sm:hidden">MAG PMMG</h1>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Tier Badge */}
                            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                                <Crown size={10} className={currentUser.tier === 'GOLD' ? 'text-yellow-400' : currentUser.tier === 'PLATINUM' ? 'text-cyan-300' : 'text-slate-400'} />
                                <span className={`text-[9px] font-bold ${currentUser.tier === 'GOLD' ? 'text-yellow-400' : currentUser.tier === 'PLATINUM' ? 'text-cyan-300' : 'text-slate-300'}`}>
                                    {currentUser.tier}
                                </span>
                            </div>
                            {/* Credits Badge */}
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentUser.credits > 0 ? 'bg-green-600/20 border-green-600/40 text-green-400' : 'bg-red-600/20 border-red-600/40 text-red-400'}`}>
                                {currentUser.credits} correções
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Menu Toggle (Visual Only for now as we stack on mobile) */}
                <div className="lg:hidden text-slate-500">
                    <Menu size={24} />
                </div>
            </div>

            {/* 2. Navigation Menu */}
            <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl overflow-x-auto">
                <button 
                  onClick={handleResetCorrector}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${view === 'app' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Home size={14} /> Corretor
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${view === 'dashboard' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <BarChart2 size={14} /> Evolução
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${view === 'history' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <Clock size={14} /> Histórico
                </button>
                <button 
                  onClick={() => setView('store')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${view === 'store' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <PlusCircle size={14} /> Loja
                </button>
            </nav>

            {/* 3. User Actions */}
            <div className="flex items-center gap-3 justify-end">
                {/* Mentor Tools */}
                {currentUser.role === 'mentor' && (
                  <div className="flex items-center gap-2 px-3 border-r border-slate-700 mr-2">
                     <span className="text-[10px] uppercase font-bold text-slate-500">Mentor:</span>
                     <button 
                       onClick={() => setView('admin')}
                       className={`p-1.5 rounded-md transition-all ${view === 'admin' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                       title="Painel Administrativo"
                     >
                       <Users size={16} />
                     </button>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 hidden md:block">
                        Olá, {currentUser.name.split(' ')[0]}
                    </span>
                    <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 text-slate-400 hover:text-red-300 transition text-xs font-bold bg-slate-800 hover:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700"
                    title="Sair"
                    >
                        <LogOut size={14} /> Sair
                    </button>
                </div>
            </div>

          </div>
        </div>
      </header>

      {/* BODY CONTENT */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* VIEW: ADMIN DASHBOARD */}
        {view === 'admin' && currentUser.role === 'mentor' ? (
           <MentorDashboard />
        ) : view === 'store' ? (
           /* VIEW: STORE */
           <StoreScreen onBack={() => setView('app')} />
        ) : view === 'history' ? (
           /* VIEW: HISTORY */
           <HistoryScreen 
              history={currentUser.history || []} 
              onSelectCorrection={handleSelectHistoryItem}
              onBack={() => setView('app')}
           />
        ) : view === 'dashboard' ? (
           /* VIEW: STUDENT DASHBOARD (NEW) */
           <StudentDashboard 
              history={currentUser.history || []} 
              onBack={() => setView('app')} 
           />
        ) : (
          /* VIEW: ESSAY CORRECTOR (Standard) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: INPUT */}
              <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-left-4 duration-500">
                  
                  {/* Info Card with Sim Mode Toggle */}
                  <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-600 shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Regras do CRS PMMG</h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                Mínimo 120 palavras (-1pt/palavra faltante). Título obrigatório.
                            </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                        <div className="flex items-center gap-2">
                            <TimerIcon size={16} className={isSimulationMode ? "text-red-500" : "text-slate-400"} />
                            <span className="text-sm font-bold text-slate-700">Modo Simulado</span>
                        </div>
                        <button 
                            onClick={() => setIsSimulationMode(!isSimulationMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSimulationMode ? 'bg-red-500' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSimulationMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                  </div>

                  {/* Input Area */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100">
                      {/* Mode Selection */}
                      <div className="p-2 bg-slate-50 flex gap-2 border-b border-slate-100">
                          <button 
                            onClick={() => handleModeSwitch('text')} 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border border-transparent flex justify-center items-center gap-2 transition-all ${mode === 'text' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}`}
                          >
                              <Keyboard size={16} /> Digitar Texto
                          </button>
                          <button 
                            onClick={() => handleModeSwitch('pdf')} 
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border border-transparent flex justify-center items-center gap-2 transition-all 
                                ${mode === 'pdf' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}
                                ${currentUser.tier === 'GRATUITO' ? 'opacity-80' : ''}
                            `}
                          >
                              {currentUser.tier === 'GRATUITO' ? <Lock size={14} className="text-yellow-600" /> : <FileText size={16} />} 
                              Foto/PDF
                              {currentUser.tier === 'GRATUITO' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded ml-1">PRO</span>}
                          </button>
                      </div>

                      <div className="p-6 space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                              <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold uppercase text-slate-400">Tema</label>
                                    <button 
                                      onClick={handleSuggestTheme}
                                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                                    >
                                      {currentUser.tier === 'GRATUITO' ? <Lock size={12} className="text-yellow-600" /> : <Lightbulb size={12} />} 
                                      Sugerir Tema
                                    </button>
                                  </div>
                                  <input 
                                    type="text" 
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                    placeholder="Ex: A importância da hierarquia..." 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm transition"
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Título</label>
                                  <input 
                                    type="text" 
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Título da Redação" 
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-none font-serif font-bold text-center transition"
                                  />
                              </div>
                          </div>

                          {/* TEXT INPUT */}
                          {mode === 'text' && (
                            <div className="block relative group">
                                <textarea 
                                  rows={15} 
                                  value={essayText}
                                  onChange={(e) => setEssayText(e.target.value)}
                                  placeholder="Imbatível, comece a escrever sua redação aqui..." 
                                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-xl focus:border-slate-800 focus:outline-none font-serif leading-relaxed text-justify resize-none text-slate-700 transition"
                                ></textarea>
                                <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-400 bg-white/90 px-2 py-1 rounded-md shadow-sm border">
                                    {handleWordCount(essayText)} palavras
                                </div>
                            </div>
                          )}

                          {/* PDF INPUT */}
                          {mode === 'pdf' && (
                            <div className="border-2 border-dashed border-slate-300 rounded-xl h-64 flex flex-col items-center justify-center hover:bg-slate-50 transition cursor-pointer relative group bg-slate-50">
                                <input 
                                  type="file" 
                                  accept="application/pdf,image/*" 
                                  onChange={handleFileChange}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition text-slate-800">
                                    <UploadCloud size={32} />
                                </div>
                                <p className="text-sm font-bold text-slate-600">Arraste ou clique para enviar</p>
                                <p className="text-xs text-slate-400 mt-1">PDFs ou Imagens legíveis</p>
                                {essayFile && (
                                  <div className="absolute bottom-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center animate-bounce">
                                      <CheckCircle size={16} className="mr-2" /> {essayFile.name}
                                  </div>
                                )}
                            </div>
                          )}

                          <button 
                            onClick={handleCorrection}
                            disabled={status === AnalysisStatus.LOADING}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-[0.98] flex justify-center items-center gap-2 group"
                          >
                              {status === AnalysisStatus.LOADING ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" /> Analisando...
                                </>
                              ) : (
                                <>
                                  <span className="group-hover:hidden flex items-center gap-2"><Gavel size={18} /> Corrigir Redação</span>
                                  <span className="hidden group-hover:flex items-center gap-2"><Wand2 size={18} /> Iniciar Mentor IA</span>
                                </>
                              )}
                          </button>
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: RESULTS */}
              <div className="lg:col-span-7">
                  
                  {/* IDLE STATE */}
                  {status === AnalysisStatus.IDLE && (
                    <div className="h-full flex flex-col justify-center items-center bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center min-h-[500px] animate-in slide-in-from-right-4 duration-500">
                        <div className="bg-slate-50 p-6 rounded-full mb-6 text-slate-300">
                            <FileBox size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Aguardando Redação</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2 text-center">
                          Preencha os campos ao lado e envie sua redação para receber uma correção detalhada do Mentor PMMG.
                        </p>
                    </div>
                  )}

                  {/* LOADING STATE */}
                  {status === AnalysisStatus.LOADING && (
                    <div className="h-full flex flex-col justify-center items-center bg-white/50 backdrop-blur rounded-xl border border-slate-200 p-12 text-center min-h-[500px]">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <PenTool className="text-slate-400" size={20} />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">O Mentor está analisando...</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto animate-pulse">
                          Verificando ortografia, coesão textual e validando o Padrão CRS (100 pontos).
                        </p>
                    </div>
                  )}

                  {/* ERROR STATE */}
                  {status === AnalysisStatus.ERROR && (
                    <div className="h-full flex flex-col justify-center items-center bg-white rounded-xl shadow-sm border border-red-100 p-12 text-center min-h-[500px]">
                        <div className="bg-red-50 p-6 rounded-full mb-6 text-red-400">
                            <AlertTriangle size={48} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Erro na Análise</h3>
                        <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
                          {errorMessage}
                        </p>
                        <button onClick={() => setStatus(AnalysisStatus.IDLE)} className="mt-6 text-slate-600 underline text-sm hover:text-slate-800">Tentar novamente</button>
                    </div>
                  )}

                  {/* SUCCESS RESULTS */}
                  {status === AnalysisStatus.SUCCESS && result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        
                        <ScoreHero 
                          score={result.nota_final} 
                          wordCount={result.contagem_palavras_ia} 
                          penalties={result.penalidades.total_deducao} 
                        />
                        
                        {/* VIEW SWITCHER: Analysis vs Ideal Version */}
                        <div className="flex bg-slate-200 p-1 rounded-xl relative">
                            <button 
                                onClick={() => handleToggleIdealView(false)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${!showIdealVersion ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Gavel size={16} /> Correção
                            </button>
                            <button 
                                onClick={() => handleToggleIdealView(true)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 
                                    ${showIdealVersion ? 'bg-yellow-400 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {['GRATUITO', 'IRON'].includes(currentUser.tier) && currentUser.role !== 'mentor' ? (
                                    <Lock size={14} className="text-slate-400" />
                                ) : (
                                    <Sparkles size={16} /> 
                                )}
                                Versão Ideal MAG CRS
                            </button>
                        </div>

                        {/* --- VIEW: IDEAL VERSION --- */}
                        {showIdealVersion ? (
                             <div className="bg-white rounded-xl border border-yellow-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-yellow-500 p-4 text-slate-900 flex justify-between items-center">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Sparkles size={20} /> O Padrão Imbatível (Versão Reescrita)
                                    </h3>
                                    <span className="text-xs font-bold bg-slate-900 text-yellow-500 px-2 py-1 rounded">Nota Máxima (100 pts)</span>
                                </div>
                                <div className="p-8">
                                    <p className="text-slate-500 text-sm mb-4 italic bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        "Imbatível, compare seu texto original com esta versão aprimorada. Observe o uso de conectivos, a clareza dos argumentos e a correção gramatical. Modele sua escrita por este padrão."
                                    </p>
                                    <div className="prose prose-slate max-w-none font-serif leading-relaxed text-slate-800 whitespace-pre-line text-justify border-l-4 border-yellow-500 pl-4">
                                        {result.versao_ideal}
                                    </div>
                                </div>
                             </div>
                        ) : (
                            /* --- VIEW: STANDARD ANALYSIS --- */
                            <>
                                {/* Pestana Tip */}
                                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100 shadow-sm relative overflow-hidden">
                                    <Lightbulb className="absolute top-4 right-4 text-yellow-500 opacity-20" size={80} />
                                    <div className="flex items-start gap-4 relative z-10">
                                        <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                                        <span className="text-xl">🎓</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-yellow-800 text-sm uppercase tracking-wide mb-1">Dica do Especialista (Pestana)</h4>
                                            <p className="text-slate-700 italic font-serif leading-relaxed text-sm">
                                            "{result.dica_pestana}"
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Handwriting Analysis (NEW) */}
                                {result.legibilidade && (
                                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
                                            <Feather size={16} className="text-purple-500" /> Análise de Caligrafia
                                        </h4>
                                        <div className="flex items-start gap-4">
                                            <div className={`shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold ${result.legibilidade.nota >= 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                <span className="text-xl">{result.legibilidade.nota}</span>
                                                <span className="text-[9px] uppercase">Nota</span>
                                            </div>
                                            <p className="text-slate-600 text-sm leading-relaxed">
                                                {result.legibilidade.feedback}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Feedback Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FeedbackCard 
                                    title="Ortografia"
                                    score={result.ortografia.score}
                                    maxScore={20}
                                    errors={result.ortografia.errors}
                                    icon={<SpellCheck size={20} />}
                                    colorClass="bg-green-500"
                                    bgClass="bg-green-50 text-green-700"
                                    />
                                    <FeedbackCard 
                                    title="Morfossintaxe"
                                    score={result.morfossintaxe.score}
                                    maxScore={20}
                                    errors={result.morfossintaxe.errors}
                                    icon={<Type size={20} />}
                                    colorClass="bg-blue-500"
                                    bgClass="bg-blue-50 text-blue-700"
                                    />
                                    <FeedbackCard 
                                    title="Pontuação"
                                    score={result.pontuacao.score}
                                    maxScore={20}
                                    errors={result.pontuacao.errors}
                                    icon={<PenTool size={20} />}
                                    colorClass="bg-purple-500"
                                    bgClass="bg-purple-50 text-purple-700"
                                    />
                                    <FeedbackCard 
                                    title="Conteúdo e Argumentação"
                                    score={result.conteudo.score}
                                    maxScore={40}
                                    errors={[result.conteudo.feedback]}
                                    icon={<Brain size={20} />}
                                    colorClass="bg-orange-500"
                                    bgClass="bg-orange-50 text-orange-700"
                                    />
                                </div>

                                {/* Transcription (Only if PDF/Image used) */}
                                {mode === 'pdf' && (
                                    <div className="bg-slate-800 text-slate-300 rounded-xl p-6 shadow-inner">
                                        <h4 className="font-bold text-white text-sm mb-4 flex items-center">
                                            <Keyboard size={16} className="mr-2 text-blue-400" /> Transcrição da IA
                                        </h4>
                                        <div className="bg-slate-900/50 p-4 rounded-lg text-sm font-mono leading-relaxed h-48 overflow-y-auto border border-slate-700">
                                        {result.transcricao}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 text-center">
                                        Verifique se a transcrição corresponde ao que você escreveu para garantir a precisão da correção.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                  )}
              </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
