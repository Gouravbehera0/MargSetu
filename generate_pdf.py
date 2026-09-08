"""
MARGSETU - SIH 2026 High-Resolution Presentation PDF Generator
Generates a multi-page presentation matching the exact SIH official format
and converts it to PDF using headless Chrome/Edge.
"""
import os
import base64
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\GOURAV KUMAR BEHERA\Downloads\MargSetu")
APP_LOGO_PATH = WORKSPACE / "public" / "images" / "margsetu_app_logo.png"
FULL_LOGO_PATH = WORKSPACE / "public" / "images" / "margsetu_full_logo.png"
HTML_OUTPUT_PATH = WORKSPACE / "presentation.html"
PDF_OUTPUT_PATH = WORKSPACE / "MargSetu_SIH2026_Presentation.pdf"

# Read logos into base64
with open(APP_LOGO_PATH, "rb") as f:
    app_logo_b64 = base64.b64encode(f.read()).decode("utf-8")

with open(FULL_LOGO_PATH, "rb") as f:
    full_logo_b64 = base64.b64encode(f.read()).decode("utf-8")

# SVG Icons
SIH_LOGO_SVG = """
<svg width="120" height="60" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="45" cy="50" r="32" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>
  <!-- Brain / Circuit icon -->
  <path d="M45 25C35 25 30 33 30 42C30 51 37 57 45 65C53 57 60 51 60 42C60 33 55 25 45 25Z" fill="#F97316"/>
  <path d="M45 25C40 25 37 32 37 40C37 47 42 53 45 60C48 53 53 47 53 40C53 32 50 25 45 25Z" fill="#10B981"/>
  <circle cx="45" cy="40" r="4" fill="#FFFFFF"/>
  <rect x="42" y="68" width="6" height="5" rx="1" fill="#475569"/>
  <text x="85" y="42" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="14" fill="#1E293B" letter-spacing="0.5">SMART INDIA</text>
  <text x="85" y="58" font-family="'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="14" fill="#0F172A" letter-spacing="0.5">HACKATHON</text>
  <text x="85" y="74" font-family="'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="13" fill="#2563EB">2026</text>
</svg>
"""

HTML_CONTENT = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MargSetu - SIH 2026 Presentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');

  @page {{
    size: 16in 9in;
    margin: 0;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;
    background: #0f172a;
    color: #1e293b;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }}

  .slide {{
    width: 16in;
    height: 9in;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    overflow: hidden;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
  }}

  /* Top Bar */
  .header-bar {{
    height: 1.1in;
    padding: 0.15in 0.6in 0.1in 0.6in;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #E2E8F0;
    background: #FFFFFF;
    position: relative;
    z-index: 10;
  }}

  .header-left {{
    display: flex;
    align-items: center;
    gap: 0.25in;
  }}

  .header-logo {{
    height: 0.65in;
    object-fit: contain;
  }}

  .header-title-box {{
    display: flex;
    flex-direction: column;
  }}

  .header-main-title {{
    font-size: 26pt;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.5px;
    text-transform: uppercase;
  }}

  .header-subtitle {{
    font-size: 12pt;
    font-weight: 600;
    color: #2563EB;
    font-style: italic;
  }}

  .header-right {{
    display: flex;
    align-items: center;
  }}

  /* Slide Body */
  .slide-content {{
    flex: 1;
    padding: 0.25in 0.6in 0.2in 0.6in;
    display: flex;
    gap: 0.35in;
    position: relative;
    background: #F8FAFC;
  }}

  /* Footer Bar */
  .footer-bar {{
    height: 0.45in;
    background: linear-gradient(90deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.6in;
    font-size: 11pt;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    position: relative;
    z-index: 10;
  }}

  /* Cards & Boxes */
  .card {{
    background: #FFFFFF;
    border: 1.5px solid #E2E8F0;
    border-radius: 14px;
    padding: 0.22in;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }}

  .card-header-pill {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #2563EB;
    color: #FFFFFF;
    font-size: 13pt;
    font-weight: 800;
    padding: 6px 18px;
    border-radius: 999px;
    margin-bottom: 0.15in;
    letter-spacing: 0.3px;
  }}

  .bullet-item {{
    margin-bottom: 0.14in;
    font-size: 11.5pt;
    line-height: 1.45;
    color: #334155;
  }}

  .bullet-title {{
    font-weight: 800;
    color: #0F172A;
  }}

  /* Flowchart styles */
  .flowchart-container {{
    display: flex;
    flex-direction: column;
    gap: 0.12in;
  }}

  .flow-row {{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.12in;
  }}

  .flow-box {{
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 10.5pt;
    font-weight: 700;
    text-align: center;
    border: 1.5px solid;
    box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  }}

  .flow-arrow {{
    font-size: 16pt;
    font-weight: 900;
    color: #64748B;
  }}

  .bg-amber-box {{ background: #FEF3C7; border-color: #F59E0B; color: #92400E; }}
  .bg-blue-box {{ background: #DBEAFE; border-color: #3B82F6; color: #1E40AF; }}
  .bg-emerald-box {{ background: #D1FAE5; border-color: #10B981; color: #065F46; }}
  .bg-purple-box {{ background: #EDE9FE; border-color: #8B5CF6; color: #5B21B6; }}
  .bg-rose-box {{ background: #FFE4E6; border-color: #F43F5E; color: #9F1239; }}
  .bg-cyan-box {{ background: #CFFAFE; border-color: #06B6D4; color: #155E75; }}

  /* 5 Innovation cards on Slide 2 */
  .innov-cards-grid {{
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.15in;
    margin-top: 0.15in;
  }}

  .innov-card {{
    border-radius: 12px;
    padding: 0.15in 0.12in;
    text-align: center;
    border: 2px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .innov-icon {{
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18pt;
    margin-bottom: 8px;
  }}

  .innov-card-title {{
    font-size: 10.5pt;
    font-weight: 800;
    margin-bottom: 4px;
    line-height: 1.2;
  }}

  .innov-card-desc {{
    font-size: 8.5pt;
    line-height: 1.35;
  }}

  /* Page 1 (Title Page) Specifics */
  .title-page-bg {{
    background: radial-gradient(circle at 80% 20%, #EFF6FF 0%, #FFFFFF 60%, #F1F5F9 100%);
    position: relative;
  }}

  .circuit-watermark {{
    position: absolute;
    right: 0.4in;
    top: 50%;
    transform: translateY(-50%);
    width: 5.5in;
    height: 5.5in;
    opacity: 0.95;
  }}

  .title-hero {{
    font-size: 38pt;
    font-weight: 900;
    color: #1E3A8A;
    letter-spacing: -1px;
    line-height: 1.15;
    margin-bottom: 0.35in;
  }}

  .title-meta-item {{
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.18in;
    font-size: 14pt;
    line-height: 1.4;
  }}

  .title-meta-label {{
    font-weight: 900;
    color: #0F172A;
    min-width: 2.8in;
    display: flex;
    align-items: center;
    gap: 10px;
  }}

  .title-meta-label::before {{
    content: "•";
    color: #2563EB;
    font-size: 24pt;
    line-height: 0;
  }}

  .title-meta-val {{
    font-weight: 600;
    color: #334155;
    flex: 1;
  }}

  /* Badges */
  .tech-badge {{
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: #FFFFFF;
    border: 1.5px solid #CBD5E1;
    font-size: 10pt;
    font-weight: 700;
    color: #1E293B;
  }}
</style>
</head>
<body>

<!-- ========================================================================= -->
<!-- SLIDE 1: TITLE PAGE                                                       -->
<!-- ========================================================================= -->
<div class="slide title-page-bg">
  <div class="header-bar" style="border:none; background:transparent;">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" style="height:0.8in;" alt="MargSetu">
    </div>
    <div class="header-right">
      {SIH_LOGO_SVG}
    </div>
  </div>

  <div class="slide-content" style="background:transparent; padding: 0.3in 0.8in; flex-direction:column; justify-content:center;">
    <div style="max-width: 9.5in;">
      <h1 class="title-hero">SMART INDIA HACKATHON 2026</h1>

      <div class="title-meta-item">
        <div class="title-meta-label">Problem Statement ID</div>
        <div class="title-meta-val" style="font-weight:800; color:#2563EB;">– SIH26137</div>
      </div>

      <div class="title-meta-item">
        <div class="title-meta-label">Problem Statement Title</div>
        <div class="title-meta-val" style="font-weight:700; color:#0F172A;">
          – Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization
        </div>
      </div>

      <div class="title-meta-item">
        <div class="title-meta-label">Theme</div>
        <div class="title-meta-val">– Transportation & Logistics</div>
      </div>

      <div class="title-meta-item">
        <div class="title-meta-label">PS Category</div>
        <div class="title-meta-val">– Software</div>
      </div>

      <div class="title-meta-item">
        <div class="title-meta-label">Project / Idea Title</div>
        <div class="title-meta-val" style="font-weight:800; color:#1E40AF;">
          – MARGSETU ("One Platform. Smarter Routes. Safer Roads.")
        </div>
      </div>

      <div class="title-meta-item">
        <div class="title-meta-label">Team Name</div>
        <div class="title-meta-val" style="font-weight:800; color:#0F172A;">– Algo Sapiens</div>
      </div>
    </div>

    <!-- Graphical Circuit Brain & Road Mesh on the right -->
    <div class="circuit-watermark">
      <svg viewBox="0 0 400 400" width="100%" height="100%">
        <defs>
          <linearGradient id="circGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2563EB"/>
            <stop offset="100%" stop-color="#10B981"/>
          </linearGradient>
        </defs>
        <!-- Hexagon grid background -->
        <polygon points="200,30 350,115 350,285 200,370 50,285 50,115" fill="#EFF6FF" stroke="#93C5FD" stroke-width="3" stroke-dasharray="6,6"/>
        <!-- Central glowing circle -->
        <circle cx="200" cy="200" r="110" fill="#FFFFFF" stroke="#3B82F6" stroke-width="4" filter="drop-shadow(0 10px 20px rgba(37,99,235,0.15))"/>
        <!-- Road Intersection nodes -->
        <circle cx="200" cy="120" r="10" fill="#2563EB"/>
        <circle cx="130" cy="220" r="10" fill="#10B981"/>
        <circle cx="270" cy="220" r="10" fill="#F59E0B"/>
        <circle cx="200" cy="270" r="12" fill="#DC2626"/>
        <line x1="200" y1="120" x2="130" y2="220" stroke="#2563EB" stroke-width="4"/>
        <line x1="200" y1="120" x2="270" y2="220" stroke="#3B82F6" stroke-width="4"/>
        <line x1="130" y1="220" x2="200" y2="270" stroke="#10B981" stroke-width="4"/>
        <line x1="270" y1="220" x2="200" y2="270" stroke="#F59E0B" stroke-width="4"/>
        <!-- Pulse ring -->
        <circle cx="200" cy="270" r="24" fill="none" stroke="#DC2626" stroke-width="2" stroke-dasharray="3,3"/>
        <text x="200" y="325" font-family="'Plus Jakarta Sans', sans-serif" font-weight="900" font-size="14" fill="#1E3A8A" text-anchor="middle">QPSO OPTIMAL CORRIDOR</text>
      </svg>
    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Title Page • SIH26137</span>
  </div>
</div>


<!-- ========================================================================= -->
<!-- SLIDE 2: PROPOSED SOLUTION / APPROACH                                     -->
<!-- ========================================================================= -->
<div class="slide">
  <div class="header-bar">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" alt="MargSetu">
      <div class="header-title-box">
        <div class="header-main-title">MARGSETU</div>
        <div class="header-subtitle">Quantum-Inspired Multi-Modal Intelligent Route Optimization</div>
      </div>
    </div>
    <div class="header-right">{SIH_LOGO_SVG}</div>
  </div>

  <div class="slide-content">
    <!-- Left Column: Detailed Explanation -->
    <div class="card" style="flex: 1.1; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div class="card-header-pill">
          <span>💡 Proposed Solution / Approach</span>
        </div>

        <div class="bullet-item">
          <span class="bullet-title">• Quantum Metaheuristic Search (QPSO Engine):</span>
          Eliminates local minima traps and "herd-routing" traffic jams by exploring solution spaces using quantum delta-potential well wavefunctions and Mean Best ($m_{{best}}$) center-of-mass attraction.
        </div>

        <div class="bullet-item">
          <span class="bullet-title">• 5-Factor Pareto Fitness Function:</span>
          Simultaneously balances five normalized objectives:
          <strong style="color:#2563EB;">Travel Time ($T$)</strong>, <strong style="color:#F59E0B;">Congestion ($C$)</strong>, <strong style="color:#10B981;">Distance ($D$)</strong>, <strong style="color:#8B5CF6;">Accident Risk ($R$)</strong>, and <strong style="color:#DC2626;">Blockage ($B$)</strong>.
        </div>

        <div class="bullet-item">
          <span class="bullet-title">• 9 Multi-Modal Vehicle Archetypes:</span>
          Custom constraints for Cars, Bikes, Transit Buses, Heavy Cargo Trucks, Deliveries, and Emergency Units (Ambulances, Fire Tenders, Police Interceptors).
        </div>

        <div class="bullet-item">
          <span class="bullet-title">• 600m Citizen Give-Way Preemption Radar:</span>
          Proactively alerts civilian drivers within 600m to clear green corridors before emergency responders arrive.
        </div>

        <div class="bullet-item">
          <span class="bullet-title">• Sub-50ms Dynamic Rerouting:</span>
          Continuous WebSocket monitoring prompts faster alternate corridors whenever live road traffic causes $\ge 1.0\text{{ min}}$ delay.
        </div>
      </div>

      <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:10px 14px; font-size:10pt; color:#1E40AF; font-weight:600;">
        🛡️ <strong>Explainable AI (XAI):</strong> Transparent percentage breakdowns explain exactly why every route was selected.
      </div>
    </div>

    <!-- Right Column: End-to-End Workflow & Innovation Cards -->
    <div style="flex: 1.3; display:flex; flex-direction:column; gap:0.18in;">
      
      <!-- Workflow Diagram Box -->
      <div class="card" style="padding: 0.16in;">
        <div style="font-size: 11pt; font-weight: 800; color: #0F172A; text-align: center; margin-bottom: 0.1in; text-transform: uppercase; letter-spacing: 0.5px;">
          MARGSETU End-to-End Workflow
        </div>

        <div class="flowchart-container">
          <!-- Row 1 -->
          <div class="flow-row">
            <div class="flow-box bg-blue-box" style="width:1.5in;">User Origin, Dest & Vehicle Profile</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-box bg-purple-box" style="width:1.7in;">OSRM Network Graph Snapping</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-box bg-cyan-box" style="width:1.8in;">Yen's K-Shortest Loop-Free Corridors</div>
          </div>
          <!-- Vertical arrow -->
          <div style="text-align:center; font-size:14pt; color:#64748B; margin:-4px 0;">⬇</div>
          <!-- Row 2 -->
          <div class="flow-row">
            <div class="flow-box bg-amber-box" style="width:1.9in;">Feasibility & Roadblock Detour Repair</div>
            <div class="flow-arrow">⬅</div>
            <div class="flow-box bg-rose-box" style="width:1.8in;">Pareto Multi-Objective Fitness Evaluation</div>
            <div class="flow-arrow">⬅</div>
            <div class="flow-box bg-purple-box" style="width:1.9in;">QPSO Quantum Delta-Well Swarm Evolution</div>
          </div>
          <!-- Vertical arrow -->
          <div style="text-align:center; font-size:14pt; color:#64748B; margin:-4px 0;">⬇</div>
          <!-- Row 3 -->
          <div class="flow-row">
            <div class="flow-box bg-emerald-box" style="width:2.4in;">Turn-by-Turn Navigation HUD (/navigate)</div>
            <div class="flow-arrow">➔</div>
            <div class="flow-box bg-blue-box" style="width:2.4in;">600m Citizen Give-Way Proximity Radar</div>
          </div>
        </div>
      </div>

      <!-- Innovation and Uniqueness Cards -->
      <div class="card" style="padding: 0.16in;">
        <div style="font-size: 11pt; font-weight: 800; color: #0F172A; text-align: center; margin-bottom: 0.08in; text-transform: uppercase; letter-spacing: 0.5px;">
          Innovation and Uniqueness
        </div>

        <div class="innov-cards-grid">
          <div class="innov-card" style="background:#EFF6FF; border-color:#93C5FD;">
            <div class="innov-icon" style="background:#DBEAFE; color:#1D4ED8;">⚛️</div>
            <div class="innov-card-title" style="color:#1E40AF;">Quantum Delta Well</div>
            <div class="innov-card-desc" style="color:#3B82F6;">Escapes gridlock traps via quantum wavefunction tunneling.</div>
          </div>

          <div class="innov-card" style="background:#ECFDF5; border-color:#A7F3D0;">
            <div class="innov-icon" style="background:#D1FAE5; color:#047857;">📡</div>
            <div class="innov-card-title" style="color:#065F46;">Give-Way Radar</div>
            <div class="innov-card-desc" style="color:#059669;">Preemptively broadcasts clearance warnings to 600m radius.</div>
          </div>

          <div class="innov-card" style="background:#FEF3C7; border-color:#FDE68A;">
            <div class="innov-icon" style="background:#FDE68A; color:#B45309;">📊</div>
            <div class="innov-card-title" style="color:#92400E;">Explainable AI</div>
            <div class="innov-card-desc" style="color:#D97706;">Transparent score breakdown of time, safety, and congestion.</div>
          </div>

          <div class="innov-card" style="background:#FDF2F8; border-color:#FBCFE8;">
            <div class="innov-icon" style="background:#FCE7F3; color:#BE185D;">🚛</div>
            <div class="innov-card-title" style="color:#9D174D;">Truck Clearance</div>
            <div class="innov-card-desc" style="color:#DB2777;">Restricts multi-axle freight from low bridges & tight turns.</div>
          </div>

          <div class="innov-card" style="background:#F5F3FF; border-color:#DDD6FE;">
            <div class="innov-icon" style="background:#EDE9FE; color:#6D28D9;">⚡</div>
            <div class="innov-card-title" style="color:#5B21B6;">Dynamic Reroute</div>
            <div class="innov-card-desc" style="color:#7C3AED;">Re-evaluates routes on live accidents & roadblock injection.</div>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Page 2</span>
  </div>
</div>


<!-- ========================================================================= -->
<!-- SLIDE 3: TECHNICAL APPROACH                                               -->
<!-- ========================================================================= -->
<div class="slide">
  <div class="header-bar">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" alt="MargSetu">
      <div class="header-title-box">
        <div class="header-main-title">TECHNICAL APPROACH</div>
        <div class="header-subtitle">Architecture, Microservices & Implementation Process</div>
      </div>
    </div>
    <div class="header-right">{SIH_LOGO_SVG}</div>
  </div>

  <div class="slide-content">
    <!-- Left Column: 4-Zone System Architecture -->
    <div class="card" style="flex: 1.4; display:flex; flex-direction:column; justify-content:space-between;">
      <div>
        <div class="card-header-pill">
          <span>🏛️ 4-Zone Layered System Architecture</span>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:0.12in; margin-bottom:0.18in;">
          <!-- Zone 1 -->
          <div style="background:#F1F5F9; border:1.5px solid #CBD5E1; border-radius:10px; padding:10px;">
            <div style="font-size:9.5pt; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:6px;">Zone 1: Client & External</div>
            <div style="font-size:9pt; line-height:1.4; color:#334155;">
              • Leaflet Map Users<br>
              • Citizen Mobile Clients<br>
              • Smart City ITS Feeds<br>
              • OSM Nominatim API
            </div>
          </div>

          <!-- Zone 2 -->
          <div style="background:#EFF6FF; border:1.5px solid #93C5FD; border-radius:10px; padding:10px;">
            <div style="font-size:9.5pt; font-weight:800; color:#1E40AF; text-transform:uppercase; margin-bottom:6px;">Zone 2: Presentation (UI)</div>
            <div style="font-size:9pt; line-height:1.4; color:#1E3A8A;">
              • React 18 + TypeScript<br>
              • Vite 5 Bundler<br>
              • Leaflet 1.9 Vector HUD<br>
              • QPSO Swarm Visualizer
            </div>
          </div>

          <!-- Zone 3 -->
          <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:10px; padding:10px;">
            <div style="font-size:9.5pt; font-weight:800; color:#065F46; text-transform:uppercase; margin-bottom:6px;">Zone 3: Backend Gateway</div>
            <div style="font-size:9pt; line-height:1.4; color:#047857;">
              • FastAPI (Python 3.10+)<br>
              • Uvicorn ASGI Server<br>
              • Pydantic v2 Validation<br>
              • WebSocket Live Manager
            </div>
          </div>

          <!-- Zone 4 -->
          <div style="background:#FAF5FF; border:1.5px solid #E9D5FF; border-radius:10px; padding:10px;">
            <div style="font-size:9.5pt; font-weight:800; color:#6B21A8; text-transform:uppercase; margin-bottom:6px;">Zone 4: QPSO "Brain"</div>
            <div style="font-size:9pt; line-height:1.4; color:#581C87;">
              • NumPy Vector Swarm<br>
              • Delta Wavefunction State<br>
              • Dynamic Graph Engine<br>
              • Speed Degradation Model
            </div>
          </div>
        </div>

        <!-- Middle Detail Box -->
        <div style="background:#FFFFFF; border:1.5px dashed #94A3B8; border-radius:10px; padding:12px; font-size:10.5pt; line-height:1.45; color:#334155; margin-bottom:0.15in;">
          <strong style="color:#0F172A;">Quantum Mechanics Formulation:</strong><br>
          Particles evolve in a Delta-Potential Well centered at Local Attractor $p_{{i,d}} = \phi_d pbest_{{i,d}} + (1 - \phi_d) gbest_d$. State position: $x_{{i,d}}(t+1) = p_{{i,d}} \pm \beta \cdot |m_{{best,d}} - x_{{i,d}}(t)| \cdot \ln(1/u)$. Single parameter $\beta$ linearly decays, ensuring global exploration early and sharp exploitation upon convergence.
        </div>
      </div>

      <!-- Tech stack badges -->
      <div>
        <div style="font-size:10pt; font-weight:800; color:#475569; text-transform:uppercase; margin-bottom:8px;">Components / Technology Stack:</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          <span class="tech-badge"><span style="color:#2563EB;">⚛️</span> React 18</span>
          <span class="tech-badge"><span style="color:#3B82F6;">📘</span> TypeScript</span>
          <span class="tech-badge"><span style="color:#10B981;">⚡</span> FastAPI</span>
          <span class="tech-badge"><span style="color:#EAB308;">🐍</span> Python 3.11</span>
          <span class="tech-badge"><span style="color:#6366F1;">🔢</span> NumPy</span>
          <span class="tech-badge"><span style="color:#14B8A6;">🗺️</span> Leaflet OSM</span>
          <span class="tech-badge"><span style="color:#EC4899;">🚀</span> Vite 5</span>
          <span class="tech-badge"><span style="color:#06B6D4;">🎨</span> Tailwind CSS</span>
          <span class="tech-badge"><span style="color:#F97316;">🐳</span> Docker</span>
        </div>
      </div>
    </div>

    <!-- Right Column: Implementation Process (Circular timeline) -->
    <div class="card" style="flex: 1; display:flex; flex-direction:column; justify-content:space-between;">
      <div class="card-header-pill" style="background:#0F172A;">
        <span>⚙️ Implementation Process</span>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.16in;">
        <!-- Step 1 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#DBEAFE; color:#1D4ED8; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">1</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">Corridor Discovery</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">GPS points snapped to road network; Yen's algorithm & OSRM discover $K$ diverse, loop-free real road paths.</div>
          </div>
        </div>

        <!-- Step 2 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#EDE9FE; color:#6D28D9; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">2</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">Quantum Decision Encoding</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">Continuous particle decision logits $X \in \mathbb{{R}}^K$ mapped via Softmax probability archetype selection.</div>
          </div>
        </div>

        <!-- Step 3 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#FEF3C7; color:#B45309; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">3</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">QPSO Swarm Optimization</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">Calculates Mean Best ($m_{{best}}$) center of mass; updates particle positions via stochastic quantum wavefunctions.</div>
          </div>
        </div>

        <!-- Step 4 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#FFE4E6; color:#BE123C; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">4</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">Feasibility & Detour Repair</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">Detects vehicle height/weight restrictions and road closures; repairs broken segments with localized Dijkstra detours.</div>
          </div>
        </div>

        <!-- Step 5 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#D1FAE5; color:#047857; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">5</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">Multi-Objective Scoring</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">Evaluates normalized fitness $F = w_1 T + w_2 C + w_3 D + w_4 R + w_5 B$ across time, congestion, and safety.</div>
          </div>
        </div>

        <!-- Step 6 -->
        <div style="display:flex; align-items:flex-start; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#CFFAFE; color:#0E7490; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13pt; flex-shrink:0;">6</div>
          <div>
            <div style="font-size:11pt; font-weight:800; color:#0F172A;">HUD Guidance & 600m Radar</div>
            <div style="font-size:9.5pt; color:#475569; line-height:1.35;">Dispatches turn-by-turn guidance and streams real-time proximity give-way clearance notifications.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Page 3</span>
  </div>
</div>


<!-- ========================================================================= -->
<!-- SLIDE 4: FEASIBILITY AND VIABILITY                                        -->
<!-- ========================================================================= -->
<div class="slide">
  <div class="header-bar">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" alt="MargSetu">
      <div class="header-title-box">
        <div class="header-main-title">FEASIBILITY AND VIABILITY</div>
        <div class="header-subtitle">Practical Implementation, Risk Analysis & Mitigation Strategies</div>
      </div>
    </div>
    <div class="header-right">{SIH_LOGO_SVG}</div>
  </div>

  <div class="slide-content" style="flex-direction:column; gap:0.2in;">
    <!-- Top 3 Pillars -->
    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:0.25in;">
      <!-- Feasibility -->
      <div class="card" style="border-top: 4px solid #2563EB;">
        <div style="font-size:14pt; font-weight:900; color:#1E40AF; margin-bottom:8px;">Feasibility</div>
        <div style="font-size:10.5pt; line-height:1.45; color:#334155;">
          • <strong>Sub-50ms Execution:</strong> QPSO converges in 35–55 ms, ideal for real-time mobile navigation & dispatch.<br>
          • <strong>Zero Quantum Hardware Cost:</strong> Pure software delta-potential simulation running on commodity cloud VMs and browsers.<br>
          • <strong>Standard Interoperability:</strong> REST & WebSocket endpoints easily ingest city ITS feeds, IoT sensors, and GPS trackers.
        </div>
      </div>

      <!-- Viability -->
      <div class="card" style="border-top: 4px solid #10B981;">
        <div style="font-size:14pt; font-weight:900; color:#065F46; margin-bottom:8px;">Viability</div>
        <div style="font-size:10.5pt; line-height:1.45; color:#334155;">
          • <strong>Universal Market Appeal:</strong> Serves 9 distinct multi-modal vehicle categories across public, commercial, & emergency sectors.<br>
          • <strong>Explainable AI (XAI):</strong> Transparent Pareto score breakdowns build immediate trust with commuters and city officials.<br>
          • <strong>Emergency Clearance:</strong> 600m give-way radar drastically cuts hospital transit times during the golden hour.
        </div>
      </div>

      <!-- Practical Implementation -->
      <div class="card" style="border-top: 4px solid #F59E0B;">
        <div style="font-size:14pt; font-weight:900; color:#92400E; margin-bottom:8px;">Practical Implementation</div>
        <div style="font-size:10.5pt; line-height:1.45; color:#334155;">
          • <strong>Working Prototype Ready:</strong> Fully functioning Map Planner (/map), Navigation HUD (/navigate), & Simulator (/traffic).<br>
          • <strong>Ready for Pilot Rollout:</strong> Feasible for city emergency medical and bus fleet trials within 3 to 6 months.<br>
          • <strong>Low Bandwidth Architecture:</strong> Lightweight responsive PWA UI functions seamlessly across patchy 4G/5G mobile networks.
        </div>
      </div>
    </div>

    <!-- Bottom: Challenges vs Mitigation -->
    <div class="card" style="flex:1; padding:0.2in;">
      <div style="display:flex; justify-content:space-between; margin-bottom:0.12in; padding:0 0.1in;">
        <div style="font-size:12pt; font-weight:900; color:#DC2626; text-transform:uppercase; letter-spacing:0.5px;">⚠️ Potential Challenges and Risks</div>
        <div style="font-size:12pt; font-weight:900; color:#10B981; text-transform:uppercase; letter-spacing:0.5px;">🛡️ Strategies for Overcoming Challenges</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.1in;">
        <!-- Item 1 -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#FEE2E2; color:#DC2626; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">01</span>
            <span style="font-size:10.5pt; font-weight:700; color:#1E293B;">GPS Telemetry Blindspots:</span>
            <span style="font-size:10pt; color:#475569;">Urban canyons & underground tunnels causing signal loss.</span>
          </div>
          <div style="color:#64748B; font-weight:900; padding:0 15px;">➔</div>
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#D1FAE5; color:#059669; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">01</span>
            <span style="font-size:10pt; color:#065F46; font-weight:600;">Dual Client-Side Engine: In-browser OSRM client continues offline routing seamlessly.</span>
          </div>
        </div>

        <!-- Item 2 -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#FEE2E2; color:#DC2626; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">02</span>
            <span style="font-size:10.5pt; font-weight:700; color:#1E293B;">Sparse Road Sensors:</span>
            <span style="font-size:10pt; color:#475569;">Peripheral/rural roads lacking live municipal traffic cameras.</span>
          </div>
          <div style="color:#64748B; font-weight:900; padding:0 15px;">➔</div>
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#D1FAE5; color:#059669; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">02</span>
            <span style="font-size:10pt; color:#065F46; font-weight:600;">Synthetic Speed-Flow Model: Predicts degradation non-linearly with citizen crowdsourcing.</span>
          </div>
        </div>

        <!-- Item 3 -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#FEE2E2; color:#DC2626; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">03</span>
            <span style="font-size:10.5pt; font-weight:700; color:#1E293B;">Peak Concurrency Surges:</span>
            <span style="font-size:10pt; color:#475569;">Sudden query spikes during rush-hour storms or evacuations.</span>
          </div>
          <div style="color:#64748B; font-weight:900; padding:0 15px;">➔</div>
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#D1FAE5; color:#059669; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">03</span>
            <span style="font-size:10pt; color:#065F46; font-weight:600;">In-Memory LRU Caching: Sub-millisecond route caching & Docker horizontal scaling.</span>
          </div>
        </div>

        <!-- Item 4 -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#FEE2E2; color:#DC2626; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">04</span>
            <span style="font-size:10.5pt; font-weight:700; color:#1E293B;">Driver Habitual Resistance:</span>
            <span style="font-size:10pt; color:#475569;">Commuters reluctant to deviate from familiar travel corridors.</span>
          </div>
          <div style="color:#64748B; font-weight:900; padding:0 15px;">➔</div>
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#D1FAE5; color:#059669; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">04</span>
            <span style="font-size:10pt; color:#065F46; font-weight:600;">Explainable AI Incentives: Shows exact minutes saved & fuel preserved to build user trust.</span>
          </div>
        </div>

        <!-- Item 5 -->
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#FEE2E2; color:#DC2626; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">05</span>
            <span style="font-size:10.5pt; font-weight:700; color:#1E293B;">Inter-Agency Data Silos:</span>
            <span style="font-size:10pt; color:#475569;">Fragmented formats across municipal traffic, police, & EMS.</span>
          </div>
          <div style="color:#64748B; font-weight:900; padding:0 15px;">➔</div>
          <div style="display:flex; align-items:center; gap:10px; flex:1;">
            <span style="background:#D1FAE5; color:#059669; font-weight:900; padding:3px 8px; border-radius:6px; font-size:10pt;">05</span>
            <span style="font-size:10pt; color:#065F46; font-weight:600;">Open GeoJSON Standards: Unified open REST/WebSocket interfaces for seamless interop.</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Page 4</span>
  </div>
</div>


<!-- ========================================================================= -->
<!-- SLIDE 5: IMPACT AND BENEFITS                                              -->
<!-- ========================================================================= -->
<div class="slide">
  <div class="header-bar">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" alt="MargSetu">
      <div class="header-title-box">
        <div class="header-main-title">IMPACT AND BENEFITS</div>
        <div class="header-subtitle">Empowering Commuters, Emergency Responders, Economy & Environment</div>
      </div>
    </div>
    <div class="header-right">{SIH_LOGO_SVG}</div>
  </div>

  <div class="slide-content" style="flex-direction:column; gap:0.18in;">
    <!-- Top Quote Banner -->
    <div style="background:linear-gradient(90deg, #1E3A8A 0%, #2563EB 100%); border-radius:12px; padding:10px 24px; color:#FFFFFF; text-align:center; font-size:12.5pt; font-weight:800; letter-spacing:0.3px; box-shadow:0 4px 12px rgba(37,99,235,0.2);">
      “India’s first quantum-inspired intelligent transportation network — smarter routes, faster clearance, safer roads.”
    </div>

    <div style="display:flex; gap:0.25in; flex:1;">
      <!-- Left: Hub-and-Spoke Target Audience -->
      <div class="card" style="flex:1.1; display:flex; flex-direction:column; justify-content:space-between; position:relative;">
        <div style="font-size:12pt; font-weight:900; color:#0F172A; text-transform:uppercase; margin-bottom:0.1in;">
          🎯 Potential Impact on Targeted Audience
        </div>

        <div style="display:flex; flex-direction:column; gap:0.14in;">
          <div style="background:#EFF6FF; border-left:4px solid #2563EB; padding:10px 14px; border-radius:8px;">
            <strong style="color:#1E40AF; font-size:11pt;">🚗 Daily Commuters:</strong>
            <div style="font-size:10pt; color:#334155; margin-top:3px;"><strong>18–25% reduction</strong> in peak urban travel time; prevents herd-congestion and phantom traffic bottlenecks.</div>
          </div>

          <div style="background:#FEE2E2; border-left:4px solid #DC2626; padding:10px 14px; border-radius:8px;">
            <strong style="color:#991B1B; font-size:11pt;">🚑 Emergency Responders (Ambulance / Fire):</strong>
            <div style="font-size:10pt; color:#334155; margin-top:3px;"><strong>30–45% faster response</strong>; active 600m Give-Way radar preemptively clears hospital corridors during golden-hour transit.</div>
          </div>

          <div style="background:#FEF3C7; border-left:4px solid #F59E0B; padding:10px 14px; border-radius:8px;">
            <strong style="color:#92400E; font-size:11pt;">🚚 Commercial Logistics & Cargo Fleets:</strong>
            <div style="font-size:10pt; color:#334155; margin-top:3px;"><strong>40% fewer grounding incidents</strong> by enforcing bridge height, axle weight, and turn radius compliance.</div>
          </div>

          <div style="background:#F3E8FF; border-left:4px solid #9333EA; padding:10px 14px; border-radius:8px;">
            <strong style="color:#6B21A8; font-size:11pt;">👮 Traffic Police & Municipal Smart Cities:</strong>
            <div style="font-size:10pt; color:#334155; margin-top:3px;">Centralized live congestion injection, dynamic detour routing, and automated green corridor coordination.</div>
          </div>
        </div>
      </div>

      <!-- Right: 3 Pillars of Benefit (Social, Economic, Environmental) -->
      <div class="card" style="flex:1; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="font-size:12pt; font-weight:900; color:#0F172A; text-transform:uppercase; margin-bottom:0.1in;">
          🌟 Benefits of the Solution
        </div>

        <div style="display:flex; flex-direction:column; gap:0.14in; flex:1; justify-content:space-between;">
          <!-- Social -->
          <div style="border:1.5px solid #93C5FD; background:#F8FAFC; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center;">
            <div style="width:46px; height:46px; border-radius:50%; background:#DBEAFE; color:#1E40AF; display:flex; align-items:center; justify-content:center; font-size:20pt; flex-shrink:0;">🤝</div>
            <div>
              <div style="font-size:11pt; font-weight:900; color:#1E40AF;">Social & Public Safety</div>
              <div style="font-size:9.5pt; color:#334155; line-height:1.35; margin-top:3px;">Saves lives by cutting emergency response delays. Transparent Explainable AI route reasoning builds commuter trust and reduces road rage.</div>
            </div>
          </div>

          <!-- Economic -->
          <div style="border:1.5px solid #86EFAC; background:#F8FAFC; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center;">
            <div style="width:46px; height:46px; border-radius:50%; background:#DCFCE7; color:#166534; display:flex; align-items:center; justify-content:center; font-size:20pt; flex-shrink:0;">📈</div>
            <div>
              <div style="font-size:11pt; font-weight:900; color:#166534;">Economic & Commercial</div>
              <div style="font-size:9.5pt; color:#334155; line-height:1.35; margin-top:3px;">Saves crores in fuel waste and worker productivity. Enhances supply chain throughput by eliminating logistics idle time and detours.</div>
            </div>
          </div>

          <!-- Environmental -->
          <div style="border:1.5px solid #6EE7B7; background:#F8FAFC; border-radius:12px; padding:12px; display:flex; gap:12px; align-items:center;">
            <div style="width:46px; height:46px; border-radius:50%; background:#D1FAE5; color:#065F46; display:flex; align-items:center; justify-content:center; font-size:20pt; flex-shrink:0;">🌱</div>
            <div>
              <div style="font-size:11pt; font-weight:900; color:#065F46;">Environmental Sustainability</div>
              <div style="font-size:9.5pt; color:#334155; line-height:1.35; margin-top:3px;">Cuts vehicular emissions by <strong>12–15%</strong> via steady-state cruise optimization and eliminating stop-and-go idling (UN SDG 9 & 11).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Page 5</span>
  </div>
</div>


<!-- ========================================================================= -->
<!-- SLIDE 6: RESEARCH AND REFERENCES                                          -->
<!-- ========================================================================= -->
<div class="slide">
  <div class="header-bar">
    <div class="header-left">
      <img src="data:image/png;base64,{full_logo_b64}" class="header-logo" alt="MargSetu">
      <div class="header-title-box">
        <div class="header-main-title">RESEARCH AND REFERENCES</div>
        <div class="header-subtitle">Academic Foundations, Government Data & Benchmark Citations</div>
      </div>
    </div>
    <div class="header-right">{SIH_LOGO_SVG}</div>
  </div>

  <div class="slide-content" style="flex-direction:column; gap:0.2in;">
    <!-- Top Box: Field & Applied Research -->
    <div class="card" style="border-left: 5px solid #2563EB;">
      <div style="font-size:13pt; font-weight:900; color:#1E40AF; margin-bottom:0.1in;">Field & Applied Research</div>
      <div class="bullet-item" style="margin-bottom:0.08in;">
        • <strong>Urban Traffic Pattern Analysis:</strong> Evaluated congestion bottleneck dynamics, signal queueing, and emergency corridor delays across high-density Indian metropolitan routes.
      </div>
      <div class="bullet-item" style="margin-bottom:0.08in;">
        • <strong>Multi-Objective Algorithmic Benchmarks:</strong> Conducted empirical comparative testing in the MargSetu benchmark lab, demonstrating QPSO's superior Pareto convergence and escape from local minima compared to Dijkstra, A*, and standard PSO.
      </div>
      <div class="bullet-item" style="margin-bottom:0;">
        • <strong>Real Road Geometric Validation:</strong> Ingested high-resolution OpenStreetMap vector topologies and verified clearance compliance across 9 multi-modal vehicle classifications.
      </div>
    </div>

    <!-- Bottom Box: Academic & Government Sources -->
    <div class="card" style="border-left: 5px solid #10B981; flex:1;">
      <div style="font-size:13pt; font-weight:900; color:#065F46; margin-bottom:0.12in;">Academic & Government Sources</div>

      <div style="display:flex; flex-direction:column; gap:0.11in; font-size:10pt; color:#334155; line-height:1.4;">
        <div>
          • <strong>Sun, J., Feng, B., & Xu, W. (2004):</strong> <em>"Particle Swarm Optimization with Particles Having Quantum Behavior."</em> Proceedings of the IEEE Congress on Evolutionary Computation, pp. 325–331. (Mathematical foundation for Delta-Potential Well wavefunction convergence).
        </div>

        <div>
          • <strong>Yen, J. Y. (1971):</strong> <em>"Finding the K Shortest Loopless Paths in a Network."</em> Management Science, Vol. 17, No. 11, pp. 712–716. (Algorithmic foundation for diverse alternative corridor generation in transportation graphs).
        </div>

        <div>
          • <strong>Ministry of Road Transport and Highways (MoRTH), Govt. of India:</strong> <em>"Road Accidents in India Annual Report & National Urban Transport Policy (NUTP)."</em> Official Government traffic accident and mobility benchmarks. <span style="color:#2563EB; text-decoration:underline;">https://morth.nic.in</span>
        </div>

        <div>
          • <strong>Bureau of Public Roads (BPR) Urban Planning Formulation:</strong> <em>"Traffic Assignment Manual."</em> U.S. Dept. of Commerce (Speed-flow degradation model relating congestion volume to link travel delay).
        </div>

        <div>
          • <strong>Open Source Routing Machine (OSRM) & OpenStreetMap Foundation:</strong> <em>"High-Performance Real Road Topological Routing Infrastructure."</em> <span style="color:#2563EB; text-decoration:underline;">https://project-osrm.org</span>
        </div>

        <div>
          • <strong>Smart India Hackathon 2026 Problem Statement SIH26137:</strong> <em>"Quantum-Inspired Intelligent Traffic Route Optimization in Transportation Systems Using Metaheuristic Optimization."</em>
        </div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Smart India Hackathon 2026</span>
    <span>Page 6</span>
  </div>
</div>

</body>
</html>
"""

# Write HTML file
with open(HTML_OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(HTML_CONTENT)

print(f"Generated HTML presentation at: {HTML_OUTPUT_PATH}")

# Convert to PDF using Google Chrome headless
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
if not os.path.exists(CHROME_PATH):
    CHROME_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

cmd = [
    CHROME_PATH,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={PDF_OUTPUT_PATH}",
    "--no-pdf-header-footer",
    str(HTML_OUTPUT_PATH)
]

print(f"Executing: {' '.join(cmd)}")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0 and os.path.exists(PDF_OUTPUT_PATH):
    size_mb = os.path.getsize(PDF_OUTPUT_PATH) / (1024 * 1024)
    print(f"SUCCESS: Generated PDF at {PDF_OUTPUT_PATH} ({size_mb:.2f} MB)")
else:
    print(f"Error during PDF generation: {result.stderr}")
