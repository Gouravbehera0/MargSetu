import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Locate, Users, FileText, Loader2 } from 'lucide-react';
import type { EmergencyServiceType, EmergencyType } from '@/types';
import { useApp } from '@/context/AppContext';
import { createEmergencyRequest } from '@/services/supabaseQueries';

const serviceConfig: Record<EmergencyServiceType, { title: string; cta: string; icon: string; color: string }> = {
  ambulance: { title: 'Request Ambulance', cta: 'REQUEST AMBULANCE', icon: '🚑', color: 'bg-emergency-500' },
  fire: { title: 'Request Fire Brigade', cta: 'REQUEST FIRE BRIGADE', icon: '🚒', color: 'bg-orange-500' },
  police: { title: 'Request Police', cta: 'REQUEST POLICE', icon: '🚓', color: 'bg-navy-600' },
};

const emergencyTypes: { value: EmergencyType; label: string }[] = [
  { value: 'accident', label: 'Accident' },
  { value: 'medical', label: 'Medical' },
  { value: 'injury', label: 'Injury' },
  { value: 'fire', label: 'Fire' },
  { value: 'other', label: 'Other' },
];

export default function EmergencyRequestPage() {
  const navigate = useNavigate();
  const { serviceType, setServiceType, createRequest } = useApp();
  const [pickup, setPickup] = useState('Master Canteen, Bhubaneswar');
  const [emergencyType, setEmergencyType] = useState<EmergencyType>('medical');
  const [patients, setPatients] = useState(1);
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeType = serviceType ?? 'ambulance';
  const config = serviceConfig[activeType];

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await createEmergencyRequest({
        serviceType: activeType,
        emergencyType,
        pickupLocation: pickup,
        patients,
        additionalInfo: info,
        status: 'assigned',
        vehicleId: 'A102',
      });

      createRequest({
        id: result.id,
        serviceType: result.service_type,
        emergencyType: result.emergency_type,
        pickupLocation: result.pickup_location,
        patients: result.patients,
        additionalInfo: result.additional_info || '',
        status: result.status,
        vehicleId: result.vehicle_id || undefined,
        createdAt: result.created_at,
      });

      setLoading(false);
      navigate('/citizen/tracking');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create request. Please try again.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container pb-24">
      {/* Header */}
      <div className="bg-navy-800 text-white px-5 pt-12 pb-6 rounded-b-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/80 active:scale-95 mb-4">
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl ${config.color} flex items-center justify-center text-2xl shadow-lg`}>
            {config.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold">{config.title}</h1>
            <p className="text-white/60 text-sm">Fill in the details below</p>
          </div>
        </div>
      </div>

      {/* Service type tabs */}
      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(Object.keys(serviceConfig) as EmergencyServiceType[]).map((t) => (
            <button
              key={t}
              onClick={() => setServiceType(t)}
              className={`chip ${activeType === t ? 'chip-active' : 'chip-inactive'}`}
            >
              {serviceConfig[t].icon} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 pt-4">
          <div className="bg-emergency-50 border border-emergency-200 rounded-xl p-3 animate-slide-down">
            <p className="text-sm text-emergency-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="px-5 pt-5 space-y-4">
        {/* Pickup Location */}
        <div>
          <label className="text-sm font-semibold text-navy-700 mb-2 block">Pickup Location</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="input-field pl-11"
              placeholder="Enter pickup address"
            />
          </div>
          <button className="flex items-center gap-1.5 mt-2 text-sm text-blue-600 font-semibold active:scale-95">
            <Locate size={16} />
            Use Current Location
          </button>
        </div>

        {/* Emergency Type */}
        <div>
          <label className="text-sm font-semibold text-navy-700 mb-2 block">Emergency Type</label>
          <div className="grid grid-cols-3 gap-2">
            {emergencyTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setEmergencyType(t.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                  emergencyType === t.value
                    ? 'bg-navy-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Number of Patients */}
        <div>
          <label className="text-sm font-semibold text-navy-700 mb-2 block flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />
            Number of Patients
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPatients((p) => Math.max(1, p - 1))}
              className="w-11 h-11 rounded-xl bg-gray-100 text-xl font-bold text-navy-700 active:scale-90"
            >
              −
            </button>
            <span className="text-2xl font-bold text-navy-800 w-12 text-center">{patients}</span>
            <button
              onClick={() => setPatients((p) => Math.min(10, p + 1))}
              className="w-11 h-11 rounded-xl bg-gray-100 text-xl font-bold text-navy-700 active:scale-90"
            >
              +
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <label className="text-sm font-semibold text-navy-700 mb-2 block flex items-center gap-1.5">
            <FileText size={16} className="text-gray-400" />
            Additional Information
          </label>
          <textarea
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            className="input-field resize-none h-24"
            placeholder="Describe the situation..."
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`${config.color} text-white font-bold rounded-2xl py-4 text-lg w-full flex items-center justify-center gap-2 active:scale-[0.98] hover:opacity-90 transition-all disabled:opacity-50`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Assigning nearest vehicle...
            </>
          ) : (
            config.cta
          )}
        </button>
      </div>
    </div>
  );
}
