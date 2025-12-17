
import React, { useState, useEffect } from 'react';
import { Timer, Pause, Play, RefreshCw, AlertTriangle } from 'lucide-react';

interface TimerWidgetProps {
  initialMinutes?: number;
  onExpire?: () => void;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ initialMinutes = 90, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (onExpire) onExpire();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, onExpire]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialMinutes * 60);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Cores dinâmicas baseadas na urgência
  const getColors = () => {
    if (timeLeft < 600) return 'bg-red-600 border-red-700 animate-pulse'; // Menos de 10 min
    if (timeLeft < 1800) return 'bg-yellow-500 border-yellow-600'; // Menos de 30 min
    return 'bg-slate-800 border-slate-900'; // Normal
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-xl text-white transition transform hover:scale-110 ${getColors()}`}
        title="Expandir Cronômetro"
      >
        <Timer size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-2xl shadow-2xl border-2 text-white p-4 transition-all duration-300 w-64 ${getColors()}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
           <Timer size={18} />
           <span className="text-xs font-bold uppercase tracking-wider">Modo Simulado</span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="text-white/70 hover:text-white">
            <span className="text-xs">Minimizar</span>
        </button>
      </div>

      <div className="text-center my-2">
        <div className="text-4xl font-mono font-bold tracking-wider">
            {formatTime(timeLeft)}
        </div>
        {timeLeft < 600 && isActive && (
            <p className="text-xs font-bold text-white/90 mt-1 flex justify-center items-center gap-1">
                <AlertTriangle size={12} /> Acelera, Imbatível!
            </p>
        )}
      </div>

      <div className="flex justify-center gap-3 mt-4">
        <button 
            onClick={toggleTimer}
            className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg flex justify-center transition"
        >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button 
            onClick={resetTimer}
            className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg flex justify-center transition"
        >
            <RefreshCw size={20} />
        </button>
      </div>
    </div>
  );
};

export default TimerWidget;
