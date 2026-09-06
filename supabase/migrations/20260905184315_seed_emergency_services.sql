/*
# Seed Emergency Services Data

1. Inserts initial data into:
- vehicles (3 ambulances, 2 fire trucks, 2 police vehicles)
- hospitals (3 hospitals)
- fire_stations (2 fire stations)
- police_stations (2 police stations)
- ambulance_stations (2 ambulance hubs)

2. All inserts use ON CONFLICT DO NOTHING so re-running is safe.
*/

-- Vehicles
INSERT INTO vehicles (code, type, status, driver_name, driver_phone, eta, distance, mission_status, lat, lng) VALUES
('A102', 'ambulance', 'on_mission', 'Vikram Patel', '+91 99887 76655', '05:42', '2.4 km', 'en_route', 20.2961, 85.8245),
('A205', 'ambulance', 'online', 'Suresh Kumar', '+91 90011 22334', NULL, NULL, NULL, 20.3001, 85.8201),
('A308', 'ambulance', 'online', 'Anita Das', '+91 90011 44556', NULL, NULL, NULL, 20.2920, 85.8280),
('F101', 'fire', 'online', 'Mohan Reddy', '+91 91100 22334', NULL, NULL, NULL, 20.2980, 85.8260),
('F202', 'fire', 'on_mission', 'Karthik N', '+91 91100 55667', '08:15', '3.1 km', 'en_route', 20.2950, 85.8290),
('P301', 'police', 'online', 'Inspector Gupta', '+91 92233 44556', NULL, NULL, NULL, 20.2970, 85.8230),
('P302', 'police', 'online', 'SI Verma', '+91 92233 77889', NULL, NULL, NULL, 20.2940, 85.8210)
ON CONFLICT (code) DO NOTHING;

-- Hospitals
INSERT INTO hospitals (name, distance, eta, emergency_available, address, phone, beds, lat, lng) VALUES
('City Hospital', '2.1 km', '6 min', true, 'Janpath, Bhubaneswar', '+91 674 239 1000', 12, 20.2961, 85.8245),
('AIIMS Bhubaneswar', '4.5 km', '12 min', true, 'Sijua, Patia', '+91 674 239 2000', 8, 20.3050, 85.8150),
('Apollo Hospitals', '5.8 km', '15 min', false, 'Sainik School Road', '+91 674 239 3000', 0, 20.3100, 85.8300)
ON CONFLICT DO NOTHING;

-- Fire Stations
INSERT INTO fire_stations (name, distance, eta, available, address, phone, vehicles, lat, lng) VALUES
('Central Fire Station', '1.8 km', '5 min', true, 'Fire Station Square, Bhubaneswar', '+91 674 239 4000', 4, 20.2980, 85.8260),
('Unit-4 Fire Station', '3.2 km', '9 min', true, 'Unit-4, Bhubaneswar', '+91 674 239 4100', 2, 20.2920, 85.8280)
ON CONFLICT DO NOTHING;

-- Police Stations
INSERT INTO police_stations (name, distance, eta, available, address, phone, units, lat, lng) VALUES
('Capital Police Station', '2.5 km', '7 min', true, 'Unit-1, Bhubaneswar', '+91 674 239 5000', 6, 20.2970, 85.8230),
('Khandagiri Police Station', '4.0 km', '11 min', true, 'Khandagiri, Bhubaneswar', '+91 674 239 5100', 3, 20.2900, 85.8150)
ON CONFLICT DO NOTHING;

-- Ambulance Stations
INSERT INTO ambulance_stations (name, distance, eta, available, address, phone, ambulances, lat, lng) VALUES
('City Ambulance Hub', '1.2 km', '4 min', true, 'Station Road, Bhubaneswar', '+91 674 239 6000', 5, 20.2990, 85.8250),
('AIIMS Ambulance Bay', '4.5 km', '12 min', true, 'Sijua, Patia', '+91 674 239 6100', 3, 20.3050, 85.8150)
ON CONFLICT DO NOTHING;
