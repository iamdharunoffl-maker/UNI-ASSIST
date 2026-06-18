import React from 'react';
import Modal from './Modal';
import { HiExclamationTriangle } from 'react-icons/hi2';

export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to perform this action? This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${
          isDanger ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'
        }`}>
          <HiExclamationTriangle className="w-6 h-6" />
        </div>
        
        <p className="text-sm text-slate-500 mb-6 font-sans leading-relaxed">{message}</p>
        
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors focus:outline-none"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors focus:outline-none ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' 
                : 'bg-brand-600 hover:bg-brand-700 active:bg-brand-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
