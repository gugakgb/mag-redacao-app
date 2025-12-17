
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Instagram, 
  User as UserIcon, 
  CheckCircle, 
  XCircle, 
  Crown, 
  Users, 
  Settings, 
  Search, 
  Edit, 
  Trash2,
  Save,
  X,
  Loader2,
  BookOpen,
  Plus
} from 'lucide-react';
import { authService } from '../services/authService';
import { themeService } from '../services/themeService';
import { User, SubscriptionTier, Theme } from '../types';

type Tab = 'users' | 'register' | 'profile' | 'themes';

const MentorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // --- STATE FOR USER LIST ---
  const [users, setUsers] = useState<(User & { password?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<(User & { password?: string }) | null>(null);

  // --- STATE FOR REGISTER ---
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    instagram: '',
    tier: 'GRATUITO' as SubscriptionTier
  });

  // --- STATE FOR PROFILE ---
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    password: '',
    instagram: ''
  });

  // --- STATE FOR THEMES ---
  const [themes, setThemes] = useState<Theme[]>([]);
  const [themeForm, setThemeForm] = useState<Theme>({
      title: '',
      category: 'Segurança',
      description: '',
      difficulty: 'Médio'
  });

  // Load users on mount and when tab changes to users
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'profile') loadProfile();
    if (activeTab === 'themes') loadThemes();
  }, [activeTab]);

  const loadUsers = async () => {
    setIsLoading(true);
    const allUsers = await authService.getAllUsers();
    setUsers(allUsers.filter(u => u.role === 'student'));
    setIsLoading(false);
  };

  const loadProfile = async () => {
    const me = await authService.getCurrentUser();
    if (me) {
        // Note: Supabase não retorna senha por segurança. O campo ficará vazio no perfil.
        setProfileData({
            name: me.name,
            email: me.email,
            password: '', 
            instagram: me.instagram || ''
        });
    }
  };

  const loadThemes = async () => {
      setIsLoading(true);
      const data = await themeService.getThemes();
      setThemes(data);
      setIsLoading(false);
  };

  // --- HANDLERS: REGISTER ---
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    setIsLoading(true);

    if (!formData.name || !formData.email || !formData.password) {
      setMsg({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
      setIsLoading(false);
      return;
    }

    const success = await authService.registerStudent(
      formData.name,
      formData.email,
      formData.password,
      formData.instagram,
      formData.tier
    );

    if (success) {
      setMsg({ type: 'success', text: `Imbatível ${formData.name} cadastrado com sucesso!` });
      setFormData({ name: '', email: '', password: '', instagram: '', tier: 'GRATUITO' });
      loadUsers(); 
    } else {
      setMsg({ type: 'error', text: 'Erro ao cadastrar. Verifique se o email já existe.' });
    }
    setIsLoading(false);
  };

  // --- HANDLERS: USER MANAGEMENT ---
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja remover este Imbatível do sistema?")) {
        await authService.deleteUser(userId);
        loadUsers();
        setMsg({ type: 'success', text: 'Dados do usuário removidos com sucesso.' });
    }
  };

  const handleEditUser = (user: User & { password?: string }) => {
    setEditingUser(user);
    setMsg({ type: '', text: '' });
  };

  const handleSaveEdit = async () => {
    if (editingUser) {
        setIsLoading(true);
        // A função updateUser retorna true/false. Importante checar!
        const success = await authService.updateUser(editingUser);
        
        if (success) {
            setEditingUser(null);
            await loadUsers();
            setMsg({ type: 'success', text: 'Dados do aluno atualizados no banco de dados.' });
        } else {
            setMsg({ type: 'error', text: 'Erro ao atualizar: Verifique as permissões (Policies) no Supabase.' });
        }
        
        setIsLoading(false);
    }
  };

  const handleTierChange = (newTier: SubscriptionTier) => {
    if (!editingUser) return;
    
    // Atualiza os créditos automaticamente conforme o plano selecionado
    let newCredits = editingUser.credits;
    switch(newTier) {
        case 'GOLD': newCredits = 40; break;
        case 'PLATINUM': newCredits = 20; break;
        case 'IRON': newCredits = 10; break;
        case 'GRATUITO': newCredits = 2; break;
        default: newCredits = 2;
    }

    setEditingUser({
        ...editingUser,
        tier: newTier,
        credits: newCredits
    });
  };

  // --- HANDLERS: PROFILE ---
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) return;

    const updated: User = {
        ...currentUser,
        name: profileData.name,
        instagram: profileData.instagram,
    };

    await authService.updateUser(updated);
    setMsg({ type: 'success', text: 'Seu perfil foi atualizado com sucesso.' });
    setIsLoading(false);
  };

  // --- HANDLERS: THEMES ---
  const handleAddTheme = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const success = await themeService.addTheme(themeForm);
      if (success) {
          setMsg({ type: 'success', text: 'Novo tema adicionado ao banco.' });
          setThemeForm({ title: '', category: 'Segurança', description: '', difficulty: 'Médio' });
          loadThemes();
      } else {
          setMsg({ type: 'error', text: 'Erro ao adicionar tema.' });
      }
      setIsLoading(false);
  };

  const handleDeleteTheme = async (id: string) => {
      if (window.confirm("Remover este tema do banco?")) {
          await themeService.deleteTheme(id);
          loadThemes();
      }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      
      {/* TABS HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button 
            onClick={() => { setActiveTab('users'); setMsg({type:'', text:''}); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition border ${activeTab === 'users' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
        >
            <Users size={18} /> Imbatíveis
        </button>
        <button 
            onClick={() => { setActiveTab('register'); setMsg({type:'', text:''}); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition border ${activeTab === 'register' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
        >
            <UserPlus size={18} /> Novo Aluno
        </button>
        <button 
            onClick={() => { setActiveTab('themes'); setMsg({type:'', text:''}); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition border ${activeTab === 'themes' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
        >
            <BookOpen size={18} /> Banco de Temas
        </button>
        <button 
            onClick={() => { setActiveTab('profile'); setMsg({type:'', text:''}); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition border ${activeTab === 'profile' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
        >
            <Settings size={18} /> Meu Perfil
        </button>
      </div>

      {/* FEEDBACK MESSAGE */}
      {msg.text && (
        <div className={`mb-6 border rounded-xl p-4 flex items-center ${msg.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {msg.type === 'success' ? <CheckCircle size={20} className="mr-3" /> : <XCircle size={20} className="mr-3" />}
            {msg.text}
        </div>
      )}

      {/* CONTENT AREA */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 min-h-[400px]">
        
        {/* --- TAB: USERS LIST --- */}
        {activeTab === 'users' && (
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Alunos Cadastrados</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar aluno..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-400" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                                    <th className="p-4">Nome / Email</th>
                                    <th className="p-4">Plano</th>
                                    <th className="p-4">Créditos</th>
                                    <th className="p-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800">{user.name}</div>
                                            <div className="text-slate-500 text-xs">{user.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                                ${user.tier === 'GOLD' ? 'bg-yellow-100 text-yellow-700' : 
                                                user.tier === 'PLATINUM' ? 'bg-cyan-100 text-cyan-700' : 
                                                user.tier === 'IRON' ? 'bg-slate-200 text-slate-700' : 
                                                'bg-gray-100 text-gray-500'}`}>
                                                {user.tier}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono font-medium text-slate-600">
                                            {user.credits}
                                        </td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <div className="relative group">
                                                <button 
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </div>

                                            <div className="relative group">
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-slate-400">
                                            Nenhum aluno encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}

        {/* --- TAB: THEMES MANAGEMENT --- */}
        {activeTab === 'themes' && (
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Add Theme Form */}
                    <div className="md:col-span-1 bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Plus size={18} /> Novo Tema
                         </h3>
                         <form onSubmit={handleAddTheme} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Título do Tema</label>
                                <input required type="text" value={themeForm.title} onChange={(e) => setThemeForm({...themeForm, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-slate-800" placeholder="Ex: A importância da..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
                                <select value={themeForm.category} onChange={(e) => setThemeForm({...themeForm, category: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg bg-white">
                                    <option>Segurança</option>
                                    <option>Sociedade</option>
                                    <option>Direito</option>
                                    <option>Tecnologia</option>
                                    <option>Polícia</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição Curta</label>
                                <textarea required rows={3} value={themeForm.description} onChange={(e) => setThemeForm({...themeForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-slate-800" placeholder="Breve explicação..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Dificuldade</label>
                                <select value={themeForm.difficulty} onChange={(e) => setThemeForm({...themeForm, difficulty: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg bg-white">
                                    <option>Fácil</option>
                                    <option>Médio</option>
                                    <option>Difícil</option>
                                </select>
                            </div>
                            <button disabled={isLoading} type="submit" className="w-full py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition">
                                {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Adicionar Tema'}
                            </button>
                         </form>
                    </div>

                    {/* Themes List */}
                    <div className="md:col-span-2">
                        <h3 className="font-bold text-slate-800 mb-4">Temas Cadastrados ({themes.length})</h3>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                             {themes.map((theme, idx) => (
                                 <div key={theme.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-start hover:border-slate-300 transition">
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{theme.category}</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${theme.difficulty === 'Fácil' ? 'bg-green-100 text-green-700' : theme.difficulty === 'Médio' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{theme.difficulty}</span>
                                         </div>
                                         <h4 className="font-bold text-slate-800 text-sm">{theme.title}</h4>
                                         <p className="text-xs text-slate-500 mt-1">{theme.description}</p>
                                     </div>
                                     <button 
                                        onClick={() => theme.id && handleDeleteTheme(theme.id)}
                                        className="text-slate-300 hover:text-red-500 transition p-2"
                                        title="Excluir Tema"
                                     >
                                         <Trash2 size={16} />
                                     </button>
                                 </div>
                             ))}
                             {themes.length === 0 && <p className="text-slate-400 text-center py-10">Carregando temas...</p>}
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* --- TAB: NEW REGISTER --- */}
        {activeTab === 'register' && (
            <div className="p-8 max-w-2xl mx-auto">
                 <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                        <input name="name" type="text" value={formData.name} onChange={handleRegisterChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" placeholder="Nome do Aluno" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Instagram</label>
                        <input name="instagram" type="text" value={formData.instagram} onChange={handleRegisterChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" placeholder="@usuario" />
                    </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Plano Inicial</label>
                        <select name="tier" value={formData.tier} onChange={handleRegisterChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none">
                            <option value="GRATUITO">Gratuito (2 correções)</option>
                            <option value="IRON">Iron (10 correções)</option>
                            <option value="PLATINUM">Platinum (20 correções)</option>
                            <option value="GOLD">Gold (40 correções)</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <input name="email" type="email" value={formData.email} onChange={handleRegisterChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" placeholder="email@exemplo.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Senha Provisória</label>
                        <input name="password" type="text" value={formData.password} onChange={handleRegisterChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" placeholder="Senha123" />
                    </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Cadastrar Imbatível</>}
                    </button>
                </form>
            </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && (
             <div className="p-8 max-w-2xl mx-auto">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl mb-6">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                            <Crown size={16} /> Você está editando seus dados de <strong>MENTOR</strong>.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Seu Nome</label>
                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Seu Instagram</label>
                        <input type="text" value={profileData.instagram} onChange={(e) => setProfileData({...profileData, instagram: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email de Acesso</label>
                        <input type="email" disabled value={profileData.email} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" title="Contate o suporte para alterar email" />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
                        {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Atualizar Meu Perfil</>}
                    </button>
                </form>
             </div>
        )}

      </div>

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Edit size={16} /> Editando {editingUser.name}
                    </h3>
                    <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome</label>
                        <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Instagram</label>
                        <input type="text" value={editingUser.instagram || ''} onChange={(e) => setEditingUser({...editingUser, instagram: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="@usuario" />
                    </div>
                    <div className="opacity-50 pointer-events-none">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email (Fixo)</label>
                        <input type="text" value={editingUser.email} readOnly className="w-full px-3 py-2 border rounded-lg bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Plano</label>
                            <select value={editingUser.tier} onChange={(e) => handleTierChange(e.target.value as SubscriptionTier)} className="w-full px-3 py-2 border rounded-lg bg-white">
                                <option value="GRATUITO">GRATUITO</option>
                                <option value="IRON">IRON</option>
                                <option value="PLATINUM">PLATINUM</option>
                                <option value="GOLD">GOLD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Créditos</label>
                            <input type="number" value={editingUser.credits} onChange={(e) => setEditingUser({...editingUser, credits: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                         <button onClick={() => setEditingUser(null)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
                         <button onClick={handleSaveEdit} className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">Salvar Alterações</button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default MentorDashboard;
