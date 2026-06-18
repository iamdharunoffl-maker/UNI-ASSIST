import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { HiCheckCircle, HiXCircle, HiInformationCircle } from 'react-icons/hi';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccess = (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0 scale-95'
        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-emerald-50 transition-all duration-300`}
      >
        <div className="flex-1 w-0 flex items-center">
          <HiCheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-slate-900 font-sans">{message}</p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 text-sm font-medium p-1 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  };

  const showError = (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0 scale-95'
        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-rose-50 transition-all duration-300`}
      >
        <div className="flex-1 w-0 flex items-center">
          <HiXCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-slate-900 font-sans">{message}</p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 text-sm font-medium p-1 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  };

  const showInfo = (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-fade-in' : 'opacity-0 scale-95'
        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-brand-50 transition-all duration-300`}
      >
        <div className="flex-1 w-0 flex items-center">
          <HiInformationCircle className="h-6 w-6 text-brand-500 flex-shrink-0" />
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-slate-900 font-sans">{message}</p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 text-sm font-medium p-1 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 4000 });
  };

  const value = {
    success: showSuccess,
    error: showError,
    info: showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
