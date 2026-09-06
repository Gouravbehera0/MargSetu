import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export default function EmptyState({ title = 'Nothing here yet', message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        {icon ?? <Inbox size={28} className="text-gray-300" />}
      </div>
      <p className="mt-4 font-semibold text-navy-700">{title}</p>
      {message && <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">{message}</p>}
    </div>
  );
}
