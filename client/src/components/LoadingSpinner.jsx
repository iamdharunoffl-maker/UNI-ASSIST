import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};

export default LoadingSpinner;
