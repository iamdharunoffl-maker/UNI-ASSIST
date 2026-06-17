import React from 'react';

export const FormField = React.forwardRef(({ 
  label, 
  name, 
  type = 'text', 
  error, 
  className = '', 
  placeholder,
  ...props 
}, ref) => {
  const isTextArea = type === 'textarea';

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {label}
        </label>
      )}
      
      {isTextArea ? (
        <textarea
          id={name}
          name={name}
          ref={ref}
          placeholder={placeholder}
          rows={3}
          className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
            error ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
          }`}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
            error ? 'border-rose-400 bg-rose-50/10' : 'border-slate-200'
          }`}
          {...props}
        />
      )}
      
      {error && (
        <span className="text-xs text-rose-500 font-medium font-sans">
          {error.message || error}
        </span>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
