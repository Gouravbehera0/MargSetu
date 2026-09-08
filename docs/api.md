# MARGSETU API Reference Manual
**Base URL:** `http://localhost:8000` (or configured `VITE_API_URL`)

---

## 1. Route Optimization Endpoints

### 1.1 Generate Candidate Routes
`POST /api/routes/candidates`

Generates $K$ diverse, loop-free candidate paths connecting origin and destination nodes.

**Request Payload:**
```json
{
  "origin": { "lat": 20.2685, "lng": 85.8360, "name": "Master Canteen" },
  "destination": { "lat": 20.3120, "lng": 85.8180, "name": "AIIMS Hospital" },
  "vehicle_type": "car",
  "preference": "balanced"
}
```

---

### 1.2 Optimize Route with QPSO
`POST /api/routes/optimize`

Executes Quantum-Inspired Particle Swarm Optimization to find the optimal route.

**Request Payload:**
```json
{
  "origin": { "lat": 20.2685, "lng": 85.8360, "name": "Master Canteen" },
  "destination": { "lat": 20.3120, "lng": 85.8180, "name": "AIIMS Hospital" },
  "vehicle_type": "ambulance",
  "preference": "emergency",
  "particle_count": 30,
  "max_iterations": 40,
  "beta": 0.75
}
```

**Response Format:**
```json
{
  "algorithm": "QPSO",
  "route_id": "qpso-1725739200000",
  "route_name": "AIIMS Dedicated Corridor (QPSO Optimized)",
  "origin": { "lat": 20.2685, "lng": 85.8360, "name": "Master Canteen" },
  "destination": { "lat": 20.3120, "lng": 85.8180, "name": "AIIMS Hospital" },
  "distance_km": 7.8,
  "eta_minutes": 8.5,
  "fitness": 0.2084,
  "traffic_score": 0.18,
  "risk_score": 0.05,
  "blockage_score": 0.00,
  "iterations": 40,
  "computation_time_ms": 52.4,
  "convergence_history": [0.42, 0.35, 0.28, 0.24, 0.2084],
  "explainability": {
    "time_contribution": 0.095,
    "congestion_contribution": 0.045,
    "distance_contribution": 0.038,
    "risk_contribution": 0.008,
    "blockage_contribution": 0.000,
    "total_fitness": 0.2084,
    "explanation_text": "Selected by QPSO: Achieved lowest composite penalty via dedicated express links."
  },
  "route_geometry": [[20.2685, 85.8360], [20.2810, 85.8250], [20.3120, 85.8180]]
}
```

---

## 2. Traffic & Incident Simulation

### 2.1 Get Road Network Traffic Status
`GET /api/traffic`

Returns all road network segments with active congestion levels and blockage states.

### 2.2 Update Segment Traffic
`POST /api/traffic/update`

```json
{
  "edge_id": "E1",
  "traffic_level": "high",
  "is_blocked": false
}
```

---

## 3. Emergency Mode & Citizen Give-Way Alerts

### 3.1 Get Active Emergency Vehicles
`GET /api/emergency/vehicles`

Returns GPS coordinates, speed, ETA, and priority corridor polylines for active ambulances, fire trucks, and police units.

### 3.2 Dispatch Citizen Give-Way Alerts
`POST /api/emergency/give-way`

```json
{
  "vehicle_id": "ev-1",
  "alert_radius_meters": 600.0
}
```

**Response Format:**
```json
[
  {
    "id": "gw-9a21b4",
    "citizen_id": "cit-1",
    "emergency_vehicle_code": "AMB-108",
    "emergency_vehicle_type": "ambulance",
    "distance_meters": 320.0,
    "message": "🚑 Emergency ambulance approaching. Please give way immediately. (320m away - Vehicle: AMB-108)",
    "severity": "critical"
  }
]
```

---

## 4. Benchmarking Endpoints

### 4.1 Run Side-by-Side Benchmark
`POST /api/benchmark`

Runs Dijkstra, A*, Standard PSO, and QPSO on identical inputs and returns side-by-side performance metrics.
