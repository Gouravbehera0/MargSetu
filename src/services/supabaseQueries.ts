import supabase from '@/lib/supabase';
import type { EmergencyRequest, AlertItem, EmergencyContact } from '@/types';

// ---- Profiles ----
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: { name?: string; phone?: string; role?: string; vehicle_type?: string; vehicle_code?: string; saved_location?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- Vehicles ----
export async function fetchVehicles() {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchVehiclesByType(type: string) {
  const { data, error } = await supabase.from('vehicles').select('*').eq('type', type);
  if (error) throw error;
  return data ?? [];
}

// ---- Hospitals ----
export async function fetchHospitals() {
  const { data, error } = await supabase.from('hospitals').select('*');
  if (error) throw error;
  return data ?? [];
}

// ---- Fire Stations ----
export async function fetchFireStations() {
  const { data, error } = await supabase.from('fire_stations').select('*');
  if (error) throw error;
  return data ?? [];
}

// ---- Police Stations ----
export async function fetchPoliceStations() {
  const { data, error } = await supabase.from('police_stations').select('*');
  if (error) throw error;
  return data ?? [];
}

// ---- Ambulance Stations ----
export async function fetchAmbulanceStations() {
  const { data, error } = await supabase.from('ambulance_stations').select('*');
  if (error) throw error;
  return data ?? [];
}

// ---- Emergency Requests ----
export async function createEmergencyRequest(req: Omit<EmergencyRequest, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .insert({
      service_type: req.serviceType,
      emergency_type: req.emergencyType,
      pickup_location: req.pickupLocation,
      patients: req.patients,
      additional_info: req.additionalInfo,
      status: req.status,
      vehicle_id: req.vehicleId,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchUserRequests(userId: string) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveRequest(userId: string) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['requested', 'assigned', 'en_route'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateRequestStatus(requestId: string, status: EmergencyRequest['status']) {
  const { data, error } = await supabase
    .from('emergency_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function cancelRequest(requestId: string) {
  return updateRequestStatus(requestId, 'cancelled');
}

// ---- Alerts ----
export async function fetchAlerts(userId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAlert(alert: Omit<AlertItem, 'id' | 'timestamp'>) {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      distance: alert.distance,
      eta: alert.eta,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function dismissAlert(alertId: string) {
  const { error } = await supabase.from('alerts').delete().eq('id', alertId);
  if (error) throw error;
}

// ---- Emergency Contacts ----
export async function fetchEmergencyContacts(userId: string) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addEmergencyContact(contact: Omit<EmergencyContact, 'id'>) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      name: contact.name,
      phone: contact.phone,
      relation: contact.relation,
    })
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEmergencyContact(contactId: string) {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', contactId);
  if (error) throw error;
}
