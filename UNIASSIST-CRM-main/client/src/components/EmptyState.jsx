import React from 'react';
import { HiFolderOpen } from 'react-icons/hi2';

export const EmptyState = ({ 
  title = 'No records found', 
  description = 'There is no data to show in this view right now.',
  actionButton
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-2xl shadow-soft">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 text-slate-400 mb-4 ring-1 ring-slate-100">
        <HiFolderOpen className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
