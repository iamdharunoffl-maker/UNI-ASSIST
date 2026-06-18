import React from 'react';
import { HiMagnifyingGlass, HiXMark } from 'react-icons/hi2';

export const SearchBar = ({ value, onChange, placeholder = 'Search records...' }) => {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <HiMagnifyingGlass className="h-5 w-5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 text-sm rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
        >
          <HiXMark className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
