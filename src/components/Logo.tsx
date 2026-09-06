import { ShieldPlus } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 40, text: 'text-2xl' },
    lg: { icon: 64, text: 'text-4xl' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emergency-500 to-emergency-600 shadow-lg"
        style={{ width: s.icon + 8, height: s.icon + 8 }}
      >
        <ShieldPlus size={s.icon} className="text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${s.text} font-extrabold tracking-tight ${variant === 'light' ? 'text-white' : 'text-navy-800'}`}>
            Emergency
          </span>
          <span className={`${s.text} font-extrabold tracking-tight -mt-0.5 ${variant === 'light' ? 'text-emergency-400' : 'text-emergency-500'}`}>
            Connect
          </span>
        </div>
      )}
    </div>
  );
}
