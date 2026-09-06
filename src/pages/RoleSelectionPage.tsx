import { useNavigate } from 'react-router-dom';
import { Ambulance, User, ArrowRight, ChevronLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { useApp } from '@/context/AppContext';

export default function RoleSelectionPage() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const selectRole = (role: 'citizen' | 'vehicle') => {
    setRole(role);
    navigate(role === 'citizen' ? '/citizen' : '/vehicle');
  };

  return (
    <div className="mobile-container flex flex-col bg-white">
      <div className="px-5 pt-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 active:scale-95">
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
      </div>

      <div className="px-6 pt-6">
        <Logo size="sm" showText={false} />
        <h1 className="text-3xl font-extrabold text-navy-800 mt-4">Select Your Role</h1>
        <p className="text-gray-500 mt-1">Choose how you'd like to use Emergency Connect.</p>
      </div>

      <div className="flex-1 px-6 pt-8 space-y-4">
        {/* Emergency Vehicle */}
        <button
          onClick={() => selectRole('vehicle')}
          className="card p-6 w-full text-left active:scale-[0.98] hover:shadow-card-hover transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center shadow-lg shrink-0">
              <Ambulance size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-navy-800">Emergency Vehicle</h2>
              <p className="text-sm text-gray-500 mt-0.5">For Ambulance, Fire Brigade, Police, etc.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center group-hover:bg-navy-200 transition-colors">
              <ArrowRight size={20} className="text-navy-600" />
            </div>
          </div>
        </button>

        {/* Citizen */}
        <button
          onClick={() => selectRole('citizen')}
          className="card p-6 w-full text-left active:scale-[0.98] hover:shadow-card-hover transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emergency-400 to-emergency-600 flex items-center justify-center shadow-lg shrink-0">
              <User size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-navy-800">Citizen</h2>
              <p className="text-sm text-gray-500 mt-0.5">For requesting help and receiving emergency alerts.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emergency-100 flex items-center justify-center group-hover:bg-emergency-200 transition-colors">
              <ArrowRight size={20} className="text-emergency-600" />
            </div>
          </div>
        </button>
      </div>

      <div className="px-6 pb-10 pt-4">
        <p className="text-center text-xs text-gray-400">
          You can switch roles anytime from your profile settings.
        </p>
      </div>
    </div>
  );
}
