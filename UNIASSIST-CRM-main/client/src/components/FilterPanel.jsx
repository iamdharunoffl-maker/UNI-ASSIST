import React, { useState } from 'react';
import { HiFunnel, HiChevronDown, HiArrowPath } from 'react-icons/hi2';

export const FilterPanel = ({ children, onReset, isAnyFilterActive }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-white border border-slate-100 rounded-2xl shadow-soft p-4 transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-50 transition-all focus:outline-none"
        >
          <HiFunnel className="w-4 h-4 text-slate-400" />
          <span>Filters</span>
          <HiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isAnyFilterActive && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-lg transition-colors focus:outline-none"
          >
            <HiArrowPath className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100/80 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
