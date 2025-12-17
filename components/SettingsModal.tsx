import React, { useState, useEffect } from 'react';
import { Key, Lock, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) setInputKey(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Configuração do Mentor</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Google Gemini API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:outline-none text-sm" 
              placeholder="Cole sua chave aqui (AIzaSy...)"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center">
            <Lock size={12} className="mr-1" /> Sua chave é salva apenas no seu navegador.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition">Cancelar</button>
          <button 
            onClick={() => onSave(inputKey)} 
            className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/30 transition"
          >
            Salvar Acesso
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;