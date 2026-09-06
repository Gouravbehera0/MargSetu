import { Bell, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  greeting?: string;
  location?: string;
  showBack?: boolean;
  title?: string;
  onBack?: () => void;
  showNotification?: boolean;
}

export default function AppHeader({
  greeting,
  location,
  showBack = false,
  title,
  onBack,
  showNotification = true,
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-navy-800 text-white px-5 pt-12 pb-5 rounded-b-3xl shadow-lg">
      <div className="flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack ?? (() => navigate(-1))}
            className="flex items-center gap-1 text-white/90 active:scale-95 transition-transform"
          >
            <span className="text-xl">‹</span>
            <span className="text-sm font-medium">Back</span>
          </button>
        ) : (
          <div>
            {greeting && <p className="text-sm text-white/70">{greeting}</p>}
            {location && (
              <div className="flex items-center gap-1 text-white/90">
                <MapPin size={14} className="text-emergency-400" />
                <span className="text-sm font-medium">{location}</span>
              </div>
            )}
          </div>
        )}
        {showNotification && (
          <button
            onClick={() => navigate('alerts')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform"
          >
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-emergency-400 rounded-full" />
          </button>
        )}
      </div>
      {title && <h1 className="mt-3 text-xl font-bold">{title}</h1>}
    </header>
  );
}
