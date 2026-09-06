import type { ReactNode } from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  dot?: boolean;
  children?: ReactNode;
}

const variants = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  error: 'bg-emergency-100 text-emergency-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
};

const dotColors = {
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  error: 'bg-emergency-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
};

export default function StatusBadge({ status, variant = 'neutral', dot = false, children }: StatusBadgeProps) {
  const v = variants[variant];
  const dc = dotColors[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${v}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dc} animate-pulse`} />}
      {children ?? status}
    </span>
  );
}
