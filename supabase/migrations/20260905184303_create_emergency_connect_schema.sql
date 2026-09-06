/*
# Emergency Connect — Full Database Schema (re-apply)

1. New Tables
- `profiles` — extends auth.users with name, phone, role, vehicle info, saved location
- `vehicles` — emergency vehicles with status, driver info, location
- `hospitals` — hospital listings with emergency availability, beds, contact info
- `fire_stations` — fire station listings
- `police_stations` — police station listings
- `ambulance_stations` — ambulance hub listings
- `emergency_requests` — citizen emergency requests
- `alerts` — alert notifications
- `emergency_contacts` — citizen emergency contacts

2. Security
- RLS enabled on all tables.
- profiles/emergency_requests/alerts/emergency_contacts: owner-scoped via auth.uid().
- vehicles/hospitals/fire_stations/police_stations/ambulance_stations: public read (anon + authenticated).
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text DEFAULT '',
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'vehicle')),
  vehicle_type text CHECK (vehicle_type IN ('ambulance', 'fire', 'police')),
  vehicle_code text,
  saved_location text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- VEHICLES (public read)
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('ambulance', 'fire', 'police')),
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'on_mission', 'offline')),
  driver_name text DEFAULT '',
  driver_phone text DEFAULT '',
  hospital_id uuid,
  eta text,
  distance text,
  mission_status text CHECK (mission_status IN ('assigned', 'en_route', 'arrived', 'transporting', 'completed')),
  lat double precision DEFAULT 20.2961,
  lng double precision DEFAULT 85.8245,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_vehicles" ON vehicles;
CREATE POLICY "anon_read_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);

-- HOSPITALS (public read)
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  distance text DEFAULT '',
  eta text DEFAULT '',
  emergency_available boolean DEFAULT true,
  address text DEFAULT '',
  phone text DEFAULT '',
  beds integer DEFAULT 0,
  lat double precision DEFAULT 20.2961,
  lng double precision DEFAULT 85.8245,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_hospitals" ON hospitals;
CREATE POLICY "anon_read_hospitals" ON hospitals FOR SELECT
  TO anon, authenticated USING (true);

-- FIRE STATIONS (public read)
CREATE TABLE IF NOT EXISTS fire_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  distance text DEFAULT '',
  eta text DEFAULT '',
  available boolean DEFAULT true,
  address text DEFAULT '',
  phone text DEFAULT '',
  vehicles integer DEFAULT 0,
  lat double precision DEFAULT 20.2961,
  lng double precision DEFAULT 85.8245,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fire_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_fire_stations" ON fire_stations;
CREATE POLICY "anon_read_fire_stations" ON fire_stations FOR SELECT
  TO anon, authenticated USING (true);

-- POLICE STATIONS (public read)
CREATE TABLE IF NOT EXISTS police_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  distance text DEFAULT '',
  eta text DEFAULT '',
  available boolean DEFAULT true,
  address text DEFAULT '',
  phone text DEFAULT '',
  units integer DEFAULT 0,
  lat double precision DEFAULT 20.2961,
  lng double precision DEFAULT 85.8245,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE police_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_police_stations" ON police_stations;
CREATE POLICY "anon_read_police_stations" ON police_stations FOR SELECT
  TO anon, authenticated USING (true);

-- AMBULANCE STATIONS (public read)
CREATE TABLE IF NOT EXISTS ambulance_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  distance text DEFAULT '',
  eta text DEFAULT '',
  available boolean DEFAULT true,
  address text DEFAULT '',
  phone text DEFAULT '',
  ambulances integer DEFAULT 0,
  lat double precision DEFAULT 20.2961,
  lng double precision DEFAULT 85.8245,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ambulance_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_ambulance_stations" ON ambulance_stations;
CREATE POLICY "anon_read_ambulance_stations" ON ambulance_stations FOR SELECT
  TO anon, authenticated USING (true);

-- EMERGENCY REQUESTS (owner-scoped)
CREATE TABLE IF NOT EXISTS emergency_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('ambulance', 'fire', 'police')),
  emergency_type text NOT NULL CHECK (emergency_type IN ('accident', 'medical', 'injury', 'fire', 'other')),
  pickup_location text NOT NULL DEFAULT '',
  patients integer NOT NULL DEFAULT 1,
  additional_info text DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'assigned', 'en_route', 'completed', 'cancelled')),
  vehicle_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_requests" ON emergency_requests;
CREATE POLICY "select_own_requests" ON emergency_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_requests" ON emergency_requests;
CREATE POLICY "insert_own_requests" ON emergency_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_requests" ON emergency_requests;
CREATE POLICY "update_own_requests" ON emergency_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_requests" ON emergency_requests;
CREATE POLICY "delete_own_requests" ON emergency_requests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ALERTS (owner-scoped)
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ambulance_approaching', 'route_update', 'hospital_update', 'mission_update', 'traffic_alert')),
  title text NOT NULL,
  message text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info')),
  distance text,
  eta text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_alerts" ON alerts;
CREATE POLICY "select_own_alerts" ON alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON alerts;
CREATE POLICY "insert_own_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON alerts;
CREATE POLICY "delete_own_alerts" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- EMERGENCY CONTACTS (owner-scoped)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  relation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_contacts" ON emergency_contacts;
CREATE POLICY "select_own_contacts" ON emergency_contacts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_contacts" ON emergency_contacts;
CREATE POLICY "insert_own_contacts" ON emergency_contacts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_contacts" ON emergency_contacts;
CREATE POLICY "update_own_contacts" ON emergency_contacts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_contacts" ON emergency_contacts;
CREATE POLICY "delete_own_contacts" ON emergency_contacts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, phone, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), NEW.email, '', 'citizen')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
