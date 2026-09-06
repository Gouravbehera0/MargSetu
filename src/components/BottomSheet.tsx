import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-navy-900/40 animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 animate-slide-up shadow-2xl">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:scale-90">
          <X size={16} className="text-gray-500" />
        </button>
        {children}
      </div>
    </div>
  );
}
