import React, { useEffect, memo } from 'react';
import { ToastProps } from '../types';

const Toast: React.FC<ToastProps> = memo(({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
});

export default Toast;
