# MARGSETU System Architecture Document
**Tagline:** *"One Platform. Smarter Routes. Safer Roads."*  
**Problem Statement:** SIH 2026 SIH26137 — *Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization*

---

## 1. Executive Summary

**MARGSETU** is a multi-modal intelligent transportation and route optimization platform. Unlike single-purpose emergency systems, MargSetu serves general transportation across 9 distinct vehicle categories:
- Private Cars
- Motorcycles & Bikes
- Public Transit Buses
- Multi-Axle Logistics & Cargo Trucks
- Taxis & Rideshare
- Urban Delivery Fleets
- Ambulances (Emergency Priority)
- Fire Rescue Tenders (Emergency Priority)
- Police Interceptors (Emergency Priority)

The optimization engine is grounded in **Quantum-Inspired Particle Swarm Optimization (QPSO)**, which models particle search within a delta potential well to escape local minima in complex urban transportation graphs.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                        MARGSETU CLIENT INTERFACES                       |
|  - General Route Planner (/map)      - Turn-by-Turn HUD (/navigate)    |
|  - Route Comparison Matrix (/routes) - Multi-Vehicle Directory (/vehicles)|
|  - Emergency Command (/emergency)    - Traffic Simulator (/traffic)     |
|  - Incident Manager (/incidents)     - QPSO Visualizer (/optimization)  |
|  - Algorithm Benchmarks (/benchmark) - Platform Settings (/settings)   |
+------------------------------------+------------------------------------+
                                     |  HTTP REST & WebSocket (ws://)
                                     v
+-------------------------------------------------------------------------+
|                         FASTAPI BACKEND ENGINE                          |
|  - Route Dispatcher (app/api/routes.py)                                 |
|  - Traffic Simulator (app/traffic/simulation.py)                        |
|  - Emergency Radar & Proximity Broadcaster (app/emergency/give_way.py)  |
|  - Benchmarking Harness (app/api/benchmark.py)                          |
+------------------+----------------------------------+-------------------+
                   |                                  |
                   v                                  v
+-----------------------------------+  +----------------------------------+
|    DYNAMIC TRANSPORTATION GRAPH   |  |     QPSO OPTIMIZATION SUITE      |
|  - Weighted Multi-Attribute Edges |  |  - Discrete Route Encoder/Decoder|
|    * Distance, Travel Time        |  |  - Mean Best (mbest) Calculator  |
|    * Congestion Index (0.0-1.0)   |  |  - Local Attractor (p_i) Vector  |
|    * Risk Score (0.0-1.0)         |  |  - Quantum Delta Well Position   |
|    * Road Blockages & Closures    |  |  - Feasibility Checker & Repair  |
|  - OSRM / OpenStreetMap Proxy     |  |  - Multi-Factor Fitness Evaluator|
+-----------------------------------+  +----------------------------------+
                   ^                                  ^
                   +------------------+---------------+
                                      |
                       +------------------------------+
                       | COMPARATIVE BASELINE ENGINES |
                       |  - Dijkstra Algorithm        |
                       |  - A* Heuristic Search       |
                       |  - Standard PSO (v_i update) |
                       +------------------------------+
```

---

## 3. Data Flow & Routing Pipeline

1. **Input Parameters**:
   The user specifies Origin GPS, Destination GPS, Vehicle Profile, and Route Preference.
2. **Graph Candidate Generation**:
   The backend translates coordinates to the nearest graph nodes and invokes Yen's K-Shortest Paths or OSRM alternatives to build $K$ loop-free diverse candidate paths.
3. **Continuous Encoding**:
   The candidate corridors are mapped into continuous particle decision logits $X \in \mathbb{R}^K$.
4. **QPSO Evolution Loop**:
   - Particles explore the solution space under delta potential well mechanics.
   - Mean Best ($m_{best}$) and Local Attractors ($p_i$) guide the swarm toward Pareto-optimal regions.
   - Contraction-Expansion coefficient $\beta$ balances wide exploration and rapid exploitation.
5. **Decoding & Feasibility Repair**:
   Continuous positions are decoded into discrete routes. If dynamic traffic or an incident blocks an edge, the localized detour repair operator patches the path.
6. **Normalized Fitness Evaluation**:
   Routes are scored using:
   $$F = w_1 \cdot T + w_2 \cdot C + w_3 \cdot D + w_4 \cdot R + w_5 \cdot B$$
   where all five factors are normalized to $[0, 1]$.
7. **Explainability & Display**:
   The winning route, convergence curve, and detailed factor contributions are returned and rendered on the interactive OpenStreetMap Leaflet component.

---

## 4. Emergency Priority & Citizen "Give-Way" Radar

When an Emergency Vehicle (Ambulance, Fire, Police) is engaged:
- **Optimization Weights**: Prioritize travel time ($w_1 = 0.60$) and heavily penalize congested links ($w_2 = 0.20$).
- **Spatial Radar**: The engine computes Haversine distances to opted-in citizen devices within a configurable radius (e.g., 600m).
- **Instant Broadcast**: Immediate Give-Way notifications are pushed to citizens ahead on the corridor:
  > *"🚑 Emergency vehicle approaching. Please give way immediately."*

---

## 5. Deployment Topology

- **Frontend**: Vite SPA built with React 18 + TypeScript + Tailwind CSS + Leaflet. Static assets deployable to Vercel, Netlify, or Nginx.
- **Backend**: Python 3.14+ FastAPI application served via Uvicorn. Containerized using Docker.
- **Persistence**: PostgreSQL with PostGIS or Supabase Realtime, with embedded in-memory fallback.
