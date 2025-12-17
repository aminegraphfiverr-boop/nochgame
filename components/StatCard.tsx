
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  colorClass?: string;
  delayClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  colorClass = "text-pink-400", 
  delayClass = "delay-100" 
}) => {
  return (
    <div className={`glass-panel p-6 rounded-2xl flex items-center space-x-5 animate-slide-up ${delayClass}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-slate-800/40 border border-white/5 ${colorClass}`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
