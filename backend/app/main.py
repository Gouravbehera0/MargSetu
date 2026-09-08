"""
MARGSETU - Intelligent Transportation & Route Optimization Platform
FastAPI Application Entrypoint
Tagline: "One Platform. Smarter Routes. Safer Roads."
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.routes import router as routes_router
from backend.app.api.traffic import router as traffic_router
from backend.app.api.incidents import router as incidents_router
from backend.app.api.emergency import router as emergency_router
from backend.app.api.benchmark import router as benchmark_router
from backend.app.api.vehicles import router as vehicles_router
from backend.app.websocket.connection_manager import ws_manager

app = FastAPI(
    title="MARGSETU Intelligent Transportation Platform",
    description="Quantum-Inspired Particle Swarm Optimization (QPSO) Route Optimization & Traffic Control Engine",
    version="1.0.0"
)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(routes_router)
app.include_router(traffic_router)
app.include_router(incidents_router)
app.include_router(emergency_router)
app.include_router(benchmark_router)
app.include_router(vehicles_router)


@app.get("/")
def root():
    return {
        "platform": "MARGSETU",
        "tagline": "One Platform. Smarter Routes. Safer Roads.",
        "version": "1.0.0",
        "engine": "Quantum-Inspired Particle Swarm Optimization (QPSO)",
        "status": "operational",
        "docs": "/docs"
    }


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "margsetu-backend"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast heartbeats
            await ws_manager.broadcast({"type": "heartbeat", "data": data})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
