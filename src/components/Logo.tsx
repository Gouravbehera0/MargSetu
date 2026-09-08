import margSetuLogo from '@/assets/margsetu_app_logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export default function Logo({ size = 'md', showText = true, variant = 'dark' }: LogoProps) {
  const sizes = {
    sm: { box: 36, text: 'text-base', sub: 'text-[9px]' },
    md: { box: 48, text: 'text-2xl', sub: 'text-[11px]' },
    lg: { box: 64, text: 'text-3xl', sub: 'text-xs' },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-3 select-none">
      <img
        src={margSetuLogo}
        alt="MargSetu Logo"
        className="rounded-2xl object-contain shadow-md shadow-cyan-500/20 shrink-0 hover:scale-105 transition-transform"
        style={{ width: s.box, height: s.box }}
      />
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`${s.text} font-black tracking-wider ${
              variant === 'light'
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-cyan-200'
                : 'text-slate-900'
            }`}
          >
            MARGSETU
          </span>
          <span
            className={`${s.sub} font-medium tracking-tight ${
              variant === 'light' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            One Platform. Smarter Routes. Safer Roads.
          </span>
        </div>
      )}
    </div>
  );
}
