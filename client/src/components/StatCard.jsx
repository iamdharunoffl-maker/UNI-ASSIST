import React from 'react';

export const StatCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral', colorClass = 'text-brand-600 bg-brand-50' }) => {
  const trendColor = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-rose-600 bg-rose-50',
    neutral: 'text-slate-600 bg-slate-50',
  }[trendType];

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <h4 className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
            {value}
          </h4>
        </div>
        
        <div className={`p-3 rounded-2xl ${colorClass} transition-all`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${trendColor}`}>
            {trend}
          </span>
        )}
        {description && (
          <span className="text-xs text-slate-500 font-sans font-medium">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
