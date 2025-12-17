
import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, ArrowRight, FileText, ArrowLeft } from 'lucide-react';
import { CorrectionResult } from '../types';

interface HistoryScreenProps {
  history: CorrectionResult[];
  onSelectCorrection: (result: CorrectionResult) => void;
  onBack: () => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, onSelectCorrection, onBack }) => {
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8 pt-4">
        <div>
           <button 
            onClick={onBack} 
            className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
           >
            <ArrowLeft size={16} /> Voltar
           </button>
           <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
             <Clock className="text-slate-400" /> Histórico de Correções
           </h2>
        </div>
        <div className="text-right">
           <p className="text-sm text-slate-500">Total corrigidas</p>
           <p className="text-2xl font-bold text-slate-800">{history.length}</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
           <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={32} />
           </div>
           <h3 className="text-lg font-bold text-slate-700">Nenhuma redação encontrada</h3>
           <p className="text-slate-500 text-sm mt-2">Suas correções aparecerão aqui após serem analisadas pelo Mentor IA.</p>
           <button 
             onClick={onBack}
             className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
           >
             Corrigir minha primeira redação
           </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onSelectCorrection(item)}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition cursor-pointer group flex items-center justify-between"
            >
               <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border ${getScoreColor(item.nota_final)}`}>
                     <span className="text-xl font-bold">{item.nota_final}</span>
                     <span className="text-[10px] uppercase font-bold opacity-70">Nota</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                        {item.theme || "Tema Livre"}
                     </h4>
                     <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.contagem_palavras_ia} palavras</span>
                     </p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                     {item.nota_final >= 70 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                           <CheckCircle size={12} /> Aprovado
                        </span>
                     ) : item.nota_final >= 60 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                           <AlertTriangle size={12} /> Atenção
                        </span>
                     ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                           <XCircle size={12} /> Reprovado
                        </span>
                     )}
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition" />
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
