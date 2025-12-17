
import React, { useState, useEffect } from 'react';
import { BookOpen, Target, ChevronRight, Search, Shield, AlertTriangle, Zap, X, Loader2 } from 'lucide-react';
import { Theme } from '../types';
import { themeService } from '../services/themeService';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (title: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [filter, setFilter] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        loadThemes();
    }
  }, [isOpen]);

  const loadThemes = async () => {
      setLoading(true);
      const data = await themeService.getThemes();
      setThemes(data);
      setLoading(false);
  };

  if (!isOpen) return null;

  const filteredThemes = themes.filter(t => 
    t.title.toLowerCase().includes(filter.toLowerCase()) || 
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  const getIcon = (cat: string) => {
    switch(cat) {
      case 'Segurança': return <Shield size={16} className="text-blue-500" />;
      case 'Sociedade': return <Target size={16} className="text-orange-500" />;
      case 'Tecnologia': return <Zap size={16} className="text-purple-500" />;
      case 'Polícia': return <Shield size={16} className="text-slate-800" />;
      default: return <BookOpen size={16} className="text-slate-500" />;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'Fácil': return 'bg-green-100 text-green-700';
      case 'Médio': return 'bg-yellow-100 text-yellow-700';
      case 'Difícil': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="text-yellow-500" /> Banco de Temas Imbatível
            </h3>
            <p className="text-sm text-slate-500">Temas quentes para Prova do CRS PMMG</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filtrar temas (ex: segurança, tecnologia...)" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
          
          {loading ? (
             <div className="flex justify-center items-center py-20">
                 <Loader2 className="animate-spin text-slate-400" size={32} />
             </div>
          ) : (
             <>
                {filteredThemes.map(theme => (
                    <button 
                    key={theme.id || theme.title}
                    onClick={() => { onSelect(theme.title); onClose(); }}
                    className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-yellow-400 hover:shadow-md transition group relative overflow-hidden"
                    >
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-yellow-400 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-3">
                        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                        {getIcon(theme.category)} {theme.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(theme.difficulty)}`}>
                        {theme.difficulty}
                        </span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-lg mb-1 pl-3 group-hover:text-yellow-700 transition">{theme.title}</h4>
                    <p className="text-sm text-slate-500 pl-3 leading-relaxed">{theme.description}</p>
                    
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-500">
                        <ChevronRight size={24} />
                    </div>
                    </button>
                ))}
                
                {filteredThemes.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                    <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
                    <p>Nenhum tema encontrado com esse filtro.</p>
                    </div>
                )}
             </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl text-center">
          <p className="text-xs text-slate-500 font-medium">
            💡 Dica: Escolha temas que você tem mais dificuldade para treinar seus pontos fracos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
