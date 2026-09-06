import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingState({ message = 'Loading...', subMessage }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <Loader2 size={40} className="text-navy-500 animate-spin" />
      <p className="mt-4 font-semibold text-navy-700">{message}</p>
      {subMessage && <p className="text-sm text-gray-400 mt-1">{subMessage}</p>}
    </div>
  );
}
