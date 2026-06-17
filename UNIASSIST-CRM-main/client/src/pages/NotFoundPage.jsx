import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h1 className="text-9xl font-black text-brand-500 tracking-tighter mb-4 animate-pulse select-none">
        404
      </h1>
      <h2 className="text-2xl font-bold text-slate-800 mb-2 font-sans">
        Page Not Found
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed font-sans">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white rounded-xl shadow-md shadow-brand-500/10 transition-all focus:outline-none"
      >
        Go Back Home
      </button>
    </div>
  );
};

export default NotFoundPage;
