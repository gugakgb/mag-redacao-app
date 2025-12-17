
import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, User, Instagram, ArrowLeft, Key, Shield, Crown, Star } from 'lucide-react';
import { authService } from '../services/authService';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [viewState, setViewState] = useState<'login' | 'register' | 'recover'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [newName, setNewName] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Recover State
  const [recoverEmail, setRecoverEmail] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, error: loginError } = await authService.login(email, password);
      
      if (user) {
        onLoginSuccess(user);
      } else {
        const errLower = loginError?.toLowerCase() || '';

        if (errLower.includes('email not confirmed')) {
           setError('⚠️ Seu email ainda não foi confirmado. Verifique sua caixa de entrada (e spam).');
        } else if (errLower.includes('invalid login credentials')) {
           setError('❌ Email ou senha incorretos.');
        } else {
           setError(loginError || 'Erro ao conectar. Tente novamente.');
        }
      }
    } catch (err) {
        setError('Ocorreu um erro inesperado.');
    } finally {
        setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!newName || !newEmail || !newPassword) {
        setError("Preencha todos os campos obrigatórios.");
        setLoading(false);
        return;
    }

    try {
        const success = await authService.registerStudent(
            newName,
            newEmail,
            newPassword,
            newInstagram,
            'GRATUITO'
        );

        if (success) {
            setSuccessMsg("Conta criada! Verifique seu email para confirmar e ativar seu acesso.");
            setViewState('login');
            setEmail(newEmail);
            setPassword('');
        } else {
            setError("Erro ao criar conta. Verifique os dados ou tente outro email.");
        }
    } catch (err) {
        setError("Erro de conexão ao criar conta.");
    } finally {
        setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);

      if (!recoverEmail) {
          setError("Digite seu email para recuperar a senha.");
          setLoading(false);
          return;
      }

      const { success, error } = await authService.recoverPassword(recoverEmail);

      if (success) {
          setSuccessMsg("Instruções enviadas! Verifique seu email (e a caixa de spam).");
          setRecoverEmail('');
      } else {
          setError("Erro ao enviar email. Verifique se o endereço está correto.");
      }
      setLoading(false);
  };

  const switchView = (view: 'login' | 'register' | 'recover') => {
      setViewState(view);
      setError('');
      setSuccessMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-[100px]"></div>
         <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-yellow-900/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Header with Minimalist Logo (Code-Based) */}
        <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative flex items-center justify-center">
                {/* Shield Base */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl transform rotate-3 shadow-lg shadow-yellow-500/20 border border-yellow-400"></div>
                <div className="absolute inset-1 bg-slate-900 rounded-xl flex items-center justify-center">
                    <Shield size={48} className="text-yellow-500 opacity-20" />
                </div>
                {/* Logo Content */}
                <div className="relative z-10 flex flex-col items-center justify-center text-yellow-500">
                     <Crown size={28} strokeWidth={2.5} className="mb-1 drop-shadow-md" />
                     <span className="text-2xl font-black tracking-tighter leading-none text-white drop-shadow-md">MAG</span>
                     <div className="flex gap-1 mt-1">
                        <Star size={8} fill="currentColor" className="text-yellow-500" />
                        <Star size={8} fill="currentColor" className="text-yellow-500" />
                        <Star size={8} fill="currentColor" className="text-yellow-500" />
                     </div>
                </div>
            </div>
          
          <h1 className="text-2xl font-bold text-white mb-1">MAG Redação PMMG</h1>
          <p className="text-yellow-500/90 text-sm font-medium mb-2">Mentoria MAG por Marcos Gustavo da Silva</p>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700">
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
                {viewState === 'register' ? 'Cadastro Gratuito' : viewState === 'recover' ? 'Recuperar Acesso' : 'Acesso Restrito'}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
            <div className="mb-6 bg-green-500/20 border border-green-500/30 text-green-200 text-sm p-3 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                {successMsg}
            </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {viewState === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                    placeholder="seu.email@exemplo.com"
                />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Senha</label>
                <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                    <Lock size={18} />
                </div>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                    placeholder="••••••••"
                />
                </div>
                <div className="text-right mt-2">
                    <button 
                        type="button" 
                        onClick={() => switchView('recover')}
                        className="text-xs text-slate-400 hover:text-yellow-400 transition"
                    >
                        Esqueci minha senha
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold py-3.5 rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
                {loading ? 'Acessando...' : 'Entrar no Sistema'}
                {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="mt-6 text-center">
                <button 
                    type="button"
                    onClick={() => switchView('register')}
                    className="text-slate-400 hover:text-white text-sm transition underline underline-offset-4"
                >
                    Não tem conta? Cadastre-se gratuitamente
                </button>
            </div>
            </form>
        )}

        {/* --- VIEW: REGISTER --- */}
        {viewState === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nome Completo</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                        placeholder="Seu Nome"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Instagram (Opcional)</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                        <Instagram size={18} />
                    </div>
                    <input
                        type="text"
                        value={newInstagram}
                        onChange={(e) => setNewInstagram(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                        placeholder="@usuario"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                        <Mail size={18} />
                    </div>
                    <input
                        type="email"
                        required
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                        placeholder="seu.email@exemplo.com"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Criar Senha</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                        <Lock size={18} />
                    </div>
                    <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                        placeholder="••••••••"
                    />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                    {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    {loading ? 'Criando conta...' : 'Criar Conta Gratuita'}
                </button>

                 <div className="mt-4 text-center">
                    <button 
                        type="button"
                        onClick={() => switchView('login')}
                        className="text-yellow-500 hover:text-yellow-400 text-sm transition flex items-center justify-center mx-auto gap-1"
                    >
                        <ArrowLeft size={14} /> Voltar para Login
                    </button>
                </div>
            </form>
        )}

        {/* --- VIEW: RECOVER PASSWORD --- */}
        {viewState === 'recover' && (
             <form onSubmit={handleRecover} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="text-center text-slate-300 text-sm mb-4">
                    Digite seu email cadastrado para receber as instruções de redefinição de senha.
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Cadastrado</label>
                    <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-yellow-500 transition-colors">
                        <Key size={18} />
                    </div>
                    <input
                        type="email"
                        required
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all placeholder-slate-600"
                        placeholder="seu.email@exemplo.com"
                    />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-2"></div>
                    {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    {loading ? 'Enviando...' : 'Enviar Instruções'}
                </button>

                <div className="mt-4 text-center">
                    <button 
                        type="button"
                        onClick={() => switchView('login')}
                        className="text-yellow-500 hover:text-yellow-400 text-sm transition flex items-center justify-center mx-auto gap-1"
                    >
                        <ArrowLeft size={14} /> Voltar para Login
                    </button>
                </div>
            </form>
        )}

      </div>
    </div>
  );
};

export default LoginScreen;
