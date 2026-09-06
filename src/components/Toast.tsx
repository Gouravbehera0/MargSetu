import { Check, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const variantConfig = {
  success: { icon: Check, bg: 'bg-green-500', text: 'text-white' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-500', text: 'text-white' },
  info: { icon: Info, bg: 'bg-navy-600', text: 'text-white' },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => {
        const cfg = variantConfig[toast.variant];
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            className={`${cfg.bg} ${cfg.text} rounded-xl shadow-lg px-4 py-3 flex items-center gap-2.5 max-w-sm animate-slide-down pointer-events-auto`}
          >
            <Icon size={18} className="shrink-0" strokeWidth={2.5} />
            <p className="text-sm font-semibold flex-1">{toast.text}</p>
            <button onClick={() => dismissToast(toast.id)} className="shrink-0 active:scale-90">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
