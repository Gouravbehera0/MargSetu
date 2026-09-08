# MARGSETU 🚦
**"One Platform. Smarter Routes. Safer Roads."**  
*Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization*

---

## 🌟 Overview

**MARGSETU** is an enterprise-grade intelligent transportation and route optimization platform. It bridges quantum-inspired metaheuristic search with urban geographic road networks to solve complex multi-modal traffic challenges.

MargSetu is designed for general transportation users including:
- 🚗 **Cars & Taxis** (Balanced / Fastest commuting)
- 🏍️ **Motorcycles & Bikes** (Maneuverable corridor routing)
- 🚌 **Public Transit Buses** (Dedicated lane & capacity priority)
- 🚚 **Logistics & Multi-Axle Cargo Trucks** (Height, weight, & bridge clearance constraints)
- 📦 **Urban Delivery Fleets** (Dynamic multi-stop efficiency)
- 🚑 **Ambulances** (*Emergency Priority Mode with Citizen Give-Way Alerts*)
- 🚒 **Fire Rescue Tenders** (*Emergency Priority Mode with High Clearance*)
- 🚓 **Police Interceptors** (*Emergency Rapid Response*)

---

## ⚛️ Core Algorithm: Authentic QPSO

Unlike platforms that rename classical shortest-path algorithms as metaheuristics, MargSetu implements an authentic **Quantum-Inspired Particle Swarm Optimization (QPSO)** engine (`backend/app/optimization/qpso.py`):

1. **Mean Best Center of Mass**:
   $$m_{best} = \frac{1}{N} \sum_{i=1}^N pbest_i$$
2. **Local Attractor**:
   $$p_{i,d} = \phi_d \cdot pbest_{i,d} + (1 - \phi_d) \cdot gbest_d, \quad \phi_d \sim U(0, 1)$$
3. **Quantum Delta Potential Well State Update**:
   $$x_{i,d}(t+1) = p_{i,d} \pm \beta \cdot |m_{best,d} - x_{i,d}(t)| \cdot \ln(1/u_{i,d})$$
4. **Discrete Route Encoding & Repair**:
   Candidate path archetypes generated via Yen's algorithm, decoded via continuous priority logits, and dynamically repaired with localized detours when road blockages occur (`backend/app/optimization/route_encoding.py`).
5. **Multi-Factor Normalized Fitness**:
   $$F = w_1 T + w_2 C + w_3 D + w_4 R + w_5 B$$
   where $T$ = Travel Time, $C$ = Congestion, $D$ = Distance, $R$ = Risk, $B$ = Blockage.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ & npm
- Python 3.10+ (Python 3.14 compatible)

### 1. Launch Backend (FastAPI)
```bash
# In the project root:
cd backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
*FastAPI Interactive Docs:* `http://localhost:8000/docs`

### 2. Launch Frontend (React + Vite)
```bash
# In the project root:
npm install
npm run dev
```
*Frontend UI:* `http://localhost:5173`

### 3. Run Automated Tests
```bash
# Execute backend test suite:
python -m pytest backend/tests -v
```

### 4. Run via Docker Compose
```bash
docker-compose up --build
```

---

## 🗺️ Key Application Pages

| URL Route | Feature & Purpose |
| :--- | :--- |
| `/map` | **Core Map-First Route Planner**: Origin, Destination, 9 vehicle profiles, 7 preferences, Leaflet OpenStreetMap, candidate comparison, and QPSO trigger. |
| `/navigate` | **Turn-by-Turn Navigation HUD**: Maneuver indicators, live speedometer, and dynamic reroute prompts with ETA savings. |
| `/routes` | **Multi-Criteria Route Evaluation Matrix**: Side-by-side comparison across Time, Distance, Congestion, Risk, and Blockage scores. |
| `/vehicles` | **Fleet Directory**: Cars, Buses, Trucks, Deliveries, and Emergency tenders with vehicle-specific routing constraints. |
| `/emergency` | **Emergency Mode & Give-Way Radar**: Active priority corridor tracker and Citizen Give-Way proximity broadcast simulator. |
| `/traffic` | **Live Traffic Simulator**: Adjust road segment congestion (Low, Medium, High, Blocked) to observe instantaneous QPSO rerouting. |
| `/incidents` | **Incident Manager**: Report or clear accidents, roadblocks, and construction zones that update graph edge weights. |
| `/optimization` | **QPSO Swarm Visualizer**: Convergence curves ($F_{best}$ vs epoch), contraction-expansion $\beta$ slider, and algorithmic pipeline. |
| `/benchmark` | **Algorithm Benchmarking Lab**: Side-by-side execution of Dijkstra, A*, Standard PSO, and QPSO. |
| `/analytics` | **Platform KPIs**: Average ETA reductions, emergency response times, and vehicle modal shares. |
| `/settings` | **Platform Settings**: Fine-tune objective function weights ($w_1 \dots w_5$) and dynamic rerouting cooldowns. |
| `/dashboard` | **Control Center Overview**: Unified operational control hub. |

---

## 📑 Architectural Documentation

- [System Architecture](docs/architecture.md)
- [QPSO Mathematical Specification](docs/qpso.md)
- [Algorithm Comparison (Dijkstra vs A* vs PSO vs QPSO)](docs/algorithm-comparison.md)
- [REST & WebSocket API Reference](docs/api.md)

---

## 🛡️ License
Built for Smart India Hackathon (SIH 2026) Problem Statement SIH26137. Open source under the MIT License.
