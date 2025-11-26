import React from 'react';
import { XCircle } from 'lucide-react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
      <XCircle className="text-red-500" size={20} />
      <p className="text-sm text-red-800 font-medium">{message}</p>
    </div>
  );
};

export default ErrorMessage;

