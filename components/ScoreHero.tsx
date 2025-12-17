import React, { useEffect, useState } from 'react';
import { Award, AlertOctagon, FileText, TrendingUp, TrendingDown } from 'lucide-react';

interface ScoreHeroProps {
  score: number;
  wordCount: number;
  penalties: number;
}

const ScoreHero: React.FC<ScoreHeroProps> = ({ score, wordCount, penalties }) => {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = score / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [score]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorTheme = {
    main: "text-red-600",
    stroke: "stroke-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
    label: "Reprovado",
    icon: <TrendingDown size={20} className="text-red-500" />
  };

  if (score >= 70) {
    colorTheme = {
      main: "text-green-600",
      stroke: "stroke-green-500",
      bg: "bg-green-50",
      border: "border-green-100",
      label: "Aprovado",
      icon: <TrendingUp size={20} className="text-green-500" />
    };
  } else if (score >= 60) {
    colorTheme = {
      main: "text-yellow-600",
      stroke: "stroke-yellow-500",
      bg: "bg-yellow-50",
      border: "border-yellow-100",
      label: "Em Atenção",
      icon: <AlertOctagon size={20} className="text-yellow-500" />
    };
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          
          {/* Left: Big Score Gauge */}
          <div className="relative flex-shrink-0">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="none"/>
                <circle 
                  cx="80" cy="80" r={radius} 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="none" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-out ${colorTheme.stroke}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold tracking-tighter ${colorTheme.main}`}>{displayScore}</span>
                <span className="text-xs text-slate-400 font-semibold uppercase mt-1">Nota Final</span>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Metrics */}
          <div className="flex-grow w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Resultado da Análise</h2>
                <p className="text-sm text-slate-500">Baseado nos critérios do Edital 11/2025</p>
              </div>
              <div className={`px-4 py-2 rounded-full border ${colorTheme.bg} ${colorTheme.border} ${colorTheme.main} font-bold text-sm flex items-center gap-2 uppercase tracking-wide`}>
                {colorTheme.icon}
                {colorTheme.label}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Stat Card 1 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm text-slate-700">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Extensão</p>
                  <p className="text-lg font-bold text-slate-800">{wordCount} <span className="text-xs font-normal text-slate-400">palavras</span></p>
                </div>
              </div>

              {/* Stat Card 2 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm text-red-500">
                  <Award size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Penalidades</p>
                  <p className="text-lg font-bold text-red-600">-{penalties} <span className="text-xs font-normal text-slate-400">pontos</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreHero;