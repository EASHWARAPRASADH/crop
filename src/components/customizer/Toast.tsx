import { useState, useEffect } from 'react';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  title: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleToast = (event: any) => {
      const { message, type = 'info', title = 'Notification' } = event.detail;
      const id = Math.random().toString(36).substr(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type, title }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white rounded-2xl shadow-2xl border border-[#eef2f6] p-4 flex gap-4 animate-slide-in-right group relative overflow-hidden"
        >
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#5d5fef] to-[#82e9ff] animate-progress-shrink" />
          
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
            toast.type === 'error' ? 'bg-red-100 text-red-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={20} /> :
             toast.type === 'error' ? <AlertCircle size={20} /> :
             <Info size={20} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-[#1a1a1a]">{toast.title}</h4>
            <p className="text-xs text-[#919191] mt-0.5 line-clamp-2">{toast.message}</p>
          </div>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#b2b2b2] hover:text-[#1a1a1a] p-1 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Helper to show toast
export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', title: string = 'Notification') => {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type, title } }));
};
