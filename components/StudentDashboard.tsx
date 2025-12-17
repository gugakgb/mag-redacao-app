
import React, { useMemo, useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  BookOpen, 
  ArrowLeft,
  Calendar,
  AlertCircle,
  User,
  Save,
  Loader2,
  Lock
} from 'lucide-react';
import { CorrectionResult, User as UserType } from '../types';
import { authService } from '../services/authService';

interface StudentDashboardProps {
  history: CorrectionResult[];
  onBack: () => void;
}

type Tab = 'stats' | 'profile';

const StudentDashboard: React.FC<StudentDashboardProps> = ({ history, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Profile Form State
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Load User Data
  useEffect(() => {
    const loadUser = async () => {
        const user = await authService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            setName(user.name);
            setInstagram(user.instagram || '');
        }
    };
    loadUser();
  }, []);

  // --- STATISTICS CALCULATION ---
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    // Ordenar por data (mais antiga -> mais recente) para o gráfico
    const sortedHistory = [...history].reverse();
    
    const totalEssays = history.length;
    const totalScore = history.reduce((acc, curr) => acc + curr.nota_final, 0);
    const avgScore = Math.round(totalScore / totalEssays);
    const bestScore = Math.max(...history.map(h => h.nota_final));
    const latestScore = sortedHistory[sortedHistory.length - 1].nota_final;
    const firstScore = sortedHistory[0].nota_final;
    
    const evolution = latestScore - firstScore;

    return {
      sortedHistory,
      totalEssays,
      avgScore,
      bestScore,
      evolution
    };
  }, [history]);

  // --- HANDLERS ---
  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setIsLoadingProfile(true);
      setMsg({ type: '', text: '' });

      const updatedUser = {
          ...currentUser,
          name: name,
          instagram: instagram
      };

      const success = await authService.updateUser(updatedUser);
      if (success) {
          setMsg({ type: 'success', text: 'Dados atualizados com sucesso!' });
          setCurrentUser(updatedUser);
      } else {
          setMsg({ type: 'error', text: 'Erro ao atualizar. Tente novamente.' });
      }
      setIsLoadingProfile(false);
  };

  // --- CHART RENDERING (SVG) ---
  const renderChart = () => {
    if (!stats || stats.sortedHistory.length < 2) {
      return (
        <div className="h-48 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
          <p>Imbatível, faça pelo menos 2 redações para ver seu gráfico de evolução!</p>
        </div>
      );
    }

    const height = 200;
    const width = 600;
    const padding = 20;
    
    const data = stats.sortedHistory;
    const maxVal = 100;
    
    // Calculate coordinates
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - (item.nota_final / maxVal) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full overflow-hidden overflow-x-auto">
         <div className="min-w-[600px]">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
                {/* Background Lines */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
                <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                <text x={padding} y={padding - 5} fontSize="10" fill="#94a3b8">100 pts</text>
                
                {/* Evolution Path */}
                <polyline 
                    fill="none" 
                    stroke="#eab308" 
                    strokeWidth="3" 
                    points={points} 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="drop-shadow-md"
                />

                {/* Data Points */}
                {data.map((item, index) => {
                    const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
                    const y = height - padding - (item.nota_final / maxVal) * (height - 2 * padding);
                    return (
                        <g key={index} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="5" fill="white" stroke="#eab308" strokeWidth="2" />
                            <rect x={x - 20} y={y - 35} width="40" height="25" rx="4" fill="#1e293b" className="opacity-0 group-hover:opacity-100 transition" />
                            <text x={x} y={y - 20} textAnchor="middle" fill="white" fontSize="10" className="opacity-0 group-hover:opacity-100 transition font-bold">
                                {item.nota_final}
                            </text>
                        </g>
                    );
                })}
            </svg>
         </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header with Navigation */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onBack} 
                    className="bg-white p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard do Imbatível</h1>
                    <p className="text-sm text-slate-500">
                        {activeTab === 'stats' ? 'Sua jornada rumo à aprovação.' : 'Gerencie suas informações pessoais.'}
                    </p>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'stats' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <TrendingUp size={16} /> Estatísticas
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'profile' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <User size={16} /> Meus Dados
                </button>
            </div>
        </div>

        {/* --- TAB: STATS --- */}
        {activeTab === 'stats' && (
            <>
                {!stats ? (
                    <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
                        <Target size={48} className="text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">Nenhuma redação encontrada. Comece a treinar para gerar estatísticas!</p>
                        <button onClick={onBack} className="mt-4 text-blue-600 font-bold hover:underline">Ir para o Corretor</button>
                    </div>
                ) : (
                    <>
                        {/* Top Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Total Redações</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-800">{stats.totalEssays}</div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><Target size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Média Geral</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-800">{stats.avgScore} <span className="text-sm text-slate-400 font-normal">/100</span></div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Award size={20} /></div>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Melhor Nota</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-800">{stats.bestScore}</div>
                            </div>

                            <div className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between ${stats.evolution >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`p-2 rounded-lg ${stats.evolution >= 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                        {stats.evolution >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                    </div>
                                    <span className={`text-xs font-bold uppercase ${stats.evolution >= 0 ? 'text-green-700' : 'text-red-700'}`}>Evolução</span>
                                </div>
                                <div className={`text-3xl font-bold ${stats.evolution >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                                    {stats.evolution > 0 ? '+' : ''}{stats.evolution} <span className="text-sm font-normal">pontos</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts & Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Main Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-yellow-500" /> Linha do Tempo de Notas
                                </h3>
                                {renderChart()}
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-slate-400">Histórico completo de notas das suas redações corrigidas.</p>
                                </div>
                            </div>

                            {/* Recent Insights */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-blue-500" /> Feedback Recente
                                </h3>
                                
                                <div className="space-y-4 flex-grow overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                    {stats.sortedHistory.slice(-5).reverse().map((item, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-slate-500">{item.date}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.nota_final >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    Nota: {item.nota_final}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 line-clamp-2 italic">
                                                "{item.dica_pestana}"
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && currentUser && (
            <div className="max-w-2xl mx-auto">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-bold text-slate-800">Seus Dados Pessoais</h3>
                        <p className="text-sm text-slate-500">Mantenha seu perfil atualizado.</p>
                    </div>
                    
                    <div className="p-8">
                        {msg.text && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <AlertCircle size={16} /> {msg.text}
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Instagram</label>
                                <input 
                                    type="text" 
                                    value={instagram} 
                                    onChange={(e) => setInstagram(e.target.value)} 
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" 
                                    placeholder="@seu.perfil"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Email (Fixo)</label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 flex items-center justify-between cursor-not-allowed">
                                        <span className="truncate">{currentUser.email}</span>
                                        <Lock size={14} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-400 mb-2">Plano Atual</label>
                                    <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 flex items-center justify-between cursor-not-allowed">
                                        <span className={`font-bold ${currentUser.tier === 'GOLD' ? 'text-yellow-600' : currentUser.tier === 'PLATINUM' ? 'text-cyan-600' : ''}`}>
                                            {currentUser.tier}
                                        </span>
                                        <Lock size={14} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Mudança de plano apenas com o Mentor.</p>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoadingProfile} 
                                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-4"
                            >
                                {isLoadingProfile ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Salvar Alterações</>}
                            </button>
                        </form>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default StudentDashboard;
