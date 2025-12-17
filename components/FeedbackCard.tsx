import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface FeedbackCardProps {
  title: string;
  score: number;
  maxScore: number;
  errors: string[];
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

const FeedbackCard: React.FC<FeedbackCardProps> = ({ title, score, maxScore, errors, icon, colorClass, bgClass }) => {
  const [isOpen, setIsOpen] = useState(false); // Default to closed to keep dashboard clean
  const percentage = (score / maxScore) * 100;
  const isPerfect = score === maxScore;
  const hasErrors = errors.length > 0 && !isPerfect;

  // Helper to format error strings like "L1: 'error'..." into UI components
  const formatError = (errorText: string) => {
    // Regex to capture "L[number]:" or "L[number] " at start
    const lineRegex = /^(L\d+(?:-\d+)?)(?::|\s)\s*(.*)/i;
    const match = errorText.match(lineRegex);

    if (match) {
      const lineNumber = match[1];
      const description = match[2];
      
      // Try to highlight what changed if formatted like "'wrong' should be 'right'" or similar logic
      // This is a simple heuristic enhancement
      return (
        <div className="flex gap-3 items-start w-full">
          <span className="shrink-0 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-2 py-1 rounded">
            {lineNumber.toUpperCase()}
          </span>
          <span className="text-sm text-slate-600 leading-relaxed">
            {description}
          </span>
        </div>
      );
    }

    // Default return if no line number pattern found
    return <span className="text-sm text-slate-600 leading-relaxed">{errorText}</span>;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center shadow-sm`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            <p className="text-xs font-medium text-slate-400">Peso: {maxScore} pts</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className={`text-2xl font-bold ${isPerfect ? 'text-green-600' : 'text-slate-800'}`}>{score}</span>
            <span className="text-sm text-slate-400 font-medium">/{maxScore}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {hasErrors ? (
        <>
           <div 
             className={`
                transition-all duration-500 ease-in-out overflow-hidden 
                ${isOpen ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
             `}
           >
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h5 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2">
                  <AlertCircle size={12} /> Pontos de Atenção
                </h5>
                <div className="space-y-3">
                    {errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                           {formatError(err)}
                        </div>
                    ))}
                </div>
              </div>
          </div>
          
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="w-full mt-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-lg border border-transparent hover:border-slate-200 transition flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {isOpen ? 'Ocultar Correções' : `Ver ${errors.length} Correções`} 
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </>
      ) : isPerfect ? (
        <div className="mt-4 bg-green-50 rounded-xl p-3 flex items-center justify-center text-green-700 text-sm font-bold border border-green-100">
          <CheckCircle className="mr-2" size={16} /> Excelente! Nenhum erro encontrado.
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-slate-100">
           <p className="text-sm text-slate-600 italic">{errors[0]}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackCard;