import React from 'react';

export const SelectField = React.forwardRef(({ 
  label, 
  name, 
  error, 
  options = [], 
  className = '', 
  emptyOptionText = 'Select an option',
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      <select
        id={name}
        name={name}
        ref={ref}
        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
          error ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
        }`}
        {...props}
      >
        <option value="">{emptyOptionText}</option>
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      
      {error && (
        <span className="text-xs text-rose-500 font-medium font-sans">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default SelectField;
