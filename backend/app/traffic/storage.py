"""
MARGSETU - Traffic Intelligence Storage & State Manager
Thread-safe in-memory sliding-window cache, historical diurnal baseline matrix,
crowdsourced road condition reports, and Supabase SQL schema definitions.
"""
import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any

from backend.app.database.models import (
    RoadSegmentIntelligence,
    TrafficPrediction,
    RoadConditionReport,
    TrafficAnalyticsSummary,
    SpeedObservation,
    TrafficLevel
)
from backend.app.routing.network_graph import transport_graph, TransportationGraph
from backend.app.traffic.ai_analyzer import AITrafficAnalyzer
from backend.app.traffic.map_matcher import map_matcher


def ensure_utc(dt: Optional[datetime] = None) -> datetime:
    """Ensures datetime is timezone-aware in UTC."""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# Supabase / PostgreSQL Migration Script for Persistent Storage
SQL_MIGRATION_SCHEMA = """
-- 1. Road Segments Table
CREATE TABLE IF NOT EXISTS road_segments (
    segment_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    from_node VARCHAR(50),
    to_node VARCHAR(50),
    distance_km FLOAT NOT NULL DEFAULT 1.0,
    speed_limit_kmh FLOAT NOT NULL DEFAULT 50.0,
    reference_speed_kmh FLOAT NOT NULL DEFAULT 50.0,
    coordinates JSONB DEFAULT '[]'::jsonb,
    is_blocked BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ephemeral Speed Observations Table
CREATE TABLE IF NOT EXISTS speed_observations (
    id BIGSERIAL PRIMARY KEY,
    segment_id VARCHAR(50) REFERENCES road_segments(segment_id) ON DELETE CASCADE,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    speed_kmh FLOAT NOT NULL,
    heading_degrees FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_speed_obs_seg_time ON speed_observations (segment_id, created_at DESC);

-- 3. Historical Baseline Table
CREATE TABLE IF NOT EXISTS historical_traffic_baselines (
    segment_id VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL, -- 0 (Mon) - 6 (Sun)
    hour_of_day INT NOT NULL, -- 0 - 23
    average_speed_kmh FLOAT NOT NULL,
    std_dev_kmh FLOAT DEFAULT 5.0,
    sample_count INT DEFAULT 100,
    PRIMARY KEY (segment_id, day_of_week, hour_of_day)
);

-- 4. Road Condition Reports Table
CREATE TABLE IF NOT EXISTS road_condition_reports (
    id VARCHAR(100) PRIMARY KEY,
    segment_id VARCHAR(50),
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    upvotes INT DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Traffic Predictions Table
CREATE TABLE IF NOT EXISTS traffic_predictions (
    id BIGSERIAL PRIMARY KEY,
    segment_id VARCHAR(50) NOT NULL,
    horizon_minutes INT NOT NULL,
    predicted_speed_kmh FLOAT NOT NULL,
    predicted_traffic_level VARCHAR(20) NOT NULL,
    predicted_congestion_score FLOAT NOT NULL,
    confidence_score FLOAT NOT NULL,
    trend VARCHAR(20) DEFAULT 'STABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"""


class TrafficStorageManager:
    """
    Manages in-memory live telemetry sliding window, historical diurnal baselines,
    hazard reports, and synthesized segment intelligence.
    """

    def __init__(self, graph: Optional[TransportationGraph] = None):
        self.graph = graph or transport_graph
        self._lock = threading.Lock()

        # Sliding window of recent speed pings: segment_id -> deque of (speed_kmh, timestamp, heading)
        # 10 minute sliding window
        self._sliding_window: Dict[str, deque] = defaultdict(lambda: deque(maxlen=200))

        # Recent speeds history for prediction: segment_id -> list of float
        self._recent_speeds_history: Dict[str, List[float]] = defaultdict(list)

        # Road condition reports: report_id -> RoadConditionReport
        self._reports: Dict[str, RoadConditionReport] = {}

        # Historical baseline: (segment_id, day_of_week, hour_of_day) -> avg_speed_kmh
        self._historical_baselines: Dict[Tuple[str, int, int], float] = {}

        # Cached synthesized intelligence: segment_id -> RoadSegmentIntelligence
        self._cached_intelligence: Dict[str, RoadSegmentIntelligence] = {}

        self._seed_historical_baselines()
        self._seed_initial_observations()

    def _seed_historical_baselines(self):
        """Pre-seeds realistic diurnal historical profiles for all graph edges."""
        for edge_id, edge in self.graph.edges_by_id.items():
            if edge_id.endswith("_rev"):
                continue
            base_speed = edge.speed_limit_kmh

            for dow in range(7):
                is_weekend = dow in [5, 6]
                for hour in range(24):
                    # Diurnal curve calculation
                    if 8 <= hour <= 10:
                        # Morning rush
                        ratio = 0.50 if not is_weekend else 0.80
                    elif 17 <= hour <= 20:
                        # Evening rush
                        ratio = 0.42 if not is_weekend else 0.75
                    elif 12 <= hour <= 15:
                        # Afternoon normal
                        ratio = 0.70 if not is_weekend else 0.85
                    elif 0 <= hour <= 5:
                        # Late night free-flow
                        ratio = 0.95
                    else:
                        ratio = 0.80

                    hist_speed = round(base_speed * ratio, 1)
                    self._historical_baselines[(edge.id, dow, hour)] = hist_speed

    def _seed_initial_observations(self):
        """Seeds initial realistic crowdsourced observations to demonstrate real-time AI immediately."""
        now = datetime.now(timezone.utc)
        # Corridors with diverse live conditions
        demo_feed = {
            "E1": [18.0, 19.5, 17.0, 18.2, 16.5, 20.0, 17.8, 19.0, 18.5, 21.0, 17.2, 18.0, 19.1, 18.3, 17.9], # Janpath South (Heavy)
            "E2": [28.0, 31.0, 29.5, 30.0, 27.5, 32.0, 29.0], # Kalpana Link (Moderate)
            "E3": [48.0, 52.0, 50.0, 53.0, 49.0, 51.5, 50.5], # Sachivalaya South (Normal)
            "E4": [54.0, 56.0, 58.0, 52.0, 55.0, 57.0],       # Sachivalaya Marg (Normal)
            "E5": [38.0, 42.0, 40.0, 39.0, 44.0, 37.0],       # Jayadev Expressway (Moderate)
            "E6": [12.0, 14.0, 11.5, 13.0, 10.0, 15.0, 12.5, 13.5, 11.0, 14.5, 12.0], # Janpath North (Heavy/Severe)
            "E7": [45.0, 48.0, 46.0, 50.0, 47.0],             # NH-16 Connector (Normal)
            "E22": [10.0, 8.5, 11.0, 9.0, 12.0, 9.5, 10.5, 8.0, 11.5, 10.0] # Rasulgarh Overbridge (Severe)
        }

        for seg_id, speeds in demo_feed.items():
            for spd in speeds:
                self._sliding_window[seg_id].append((spd, now, None))
                self._recent_speeds_history[seg_id].append(spd)

        # Seed sample road hazard reports
        self._reports["rep-101"] = RoadConditionReport(
            id="rep-101",
            segment_id="E6",
            latitude=20.2850,
            longitude=85.8370,
            report_type="accident",
            severity="high",
            description="Minor 2-wheeler collision near Master Canteen side road causing lane blockage",
            upvotes=8,
            status="active"
        )
        self._reports["rep-102"] = RoadConditionReport(
            id="rep-102",
            segment_id="E2",
            latitude=20.2570,
            longitude=85.8360,
            report_type="pothole",
            severity="medium",
            description="Deep monsoon pothole on left carriageway before Kalpana Square",
            upvotes=4,
            status="active"
        )

    def get_historical_average_speed(self, segment_id: str, dt: Optional[datetime] = None) -> float:
        """Retrieves historical baseline speed for the specified time (or now)."""
        target = dt or datetime.now()
        dow = target.weekday()
        hour = target.hour
        val = self._historical_baselines.get((segment_id, dow, hour))
        if val is not None:
            return val

        edge = self.graph.edges_by_id.get(segment_id)
        if edge:
            return round(edge.speed_limit_kmh * 0.75, 1)
        return 40.0

    def add_speed_observation(self, obs: SpeedObservation) -> Tuple[str, RoadSegmentIntelligence]:
        """
        Ingests an anonymized GPS speed observation, map-matches if needed,
        updates the sliding window, and recalculates segment intelligence.
        """
        with self._lock:
            segment_id = obs.segment_id
            if not segment_id or segment_id not in self.graph.edges_by_id:
                match_res = map_matcher.match_point(obs.latitude, obs.longitude, obs.heading_degrees)
                segment_id = match_res[0] if match_res else "E1"

            now = ensure_utc(obs.timestamp)
            self._sliding_window[segment_id].append((obs.speed_kmh, now, obs.heading_degrees))
            self._recent_speeds_history[segment_id].append(obs.speed_kmh)
            if len(self._recent_speeds_history[segment_id]) > 30:
                self._recent_speeds_history[segment_id] = self._recent_speeds_history[segment_id][-30:]

            # Re-synthesize this segment intelligence
            intel = self._compute_segment_intelligence(segment_id)
            self._cached_intelligence[segment_id] = intel

            # Synchronize edge traffic condition in TransportationGraph
            self._sync_graph_edge(segment_id, intel)

            return segment_id, intel

    def _sync_graph_edge(self, segment_id: str, intel: RoadSegmentIntelligence):
        """Updates the physical graph edge weights according to AI traffic score."""
        edge = self.graph.edges_by_id.get(segment_id)
        if not edge:
            return

        level_map = {
            "Normal": TrafficLevel.LOW,
            "Moderate": TrafficLevel.MEDIUM,
            "Heavy": TrafficLevel.HIGH,
            "Severe": TrafficLevel.SEVERE
        }
        tl = level_map.get(intel.traffic_level, TrafficLevel.LOW)
        cong_factor = intel.congestion_score / 100.0

        self.graph.update_edge_traffic(
            edge_id=segment_id,
            traffic_level=tl,
            congestion_factor=cong_factor,
            is_blocked=intel.is_blocked
        )

    def _compute_segment_intelligence(self, segment_id: str) -> RoadSegmentIntelligence:
        """Calculates rich AI intelligence for a single road segment."""
        edge = self.graph.edges_by_id.get(segment_id)
        if not edge:
            edge = self.graph.edges_by_id.get(f"{segment_id}_rev")
        if not edge:
            # Fallback stub
            return RoadSegmentIntelligence(
                segment_id=segment_id,
                road_name="Urban Corridor",
                reference_speed_kmh=45.0,
                current_average_speed_kmh=45.0,
                historical_average_speed_kmh=40.0,
                active_observations=0,
                traffic_level="Normal",
                congestion_score=0.0,
                confidence_score=70.0,
                estimated_travel_time_min=1.5,
                coordinates=[]
            )

        # 1. Clean sliding window (last 15 minutes)
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(minutes=15)
        raw_pings = [spd for spd, ts, _ in self._sliding_window[segment_id] if ensure_utc(ts) >= cutoff]

        ref_speed = edge.speed_limit_kmh
        hist_speed = self.get_historical_average_speed(segment_id, now)

        # 2. Speed aggregation & outlier filtering
        agg_speed, variance, valid_obs_count = AITrafficAnalyzer.aggregate_speed(raw_pings, ref_speed)

        # If zero recent live observations, fallback gracefully to historical average
        if valid_obs_count == 0:
            agg_speed = hist_speed

        # 3. Check active incident penalty
        incident_penalty = 0.0
        for rep in self._reports.values():
            if rep.segment_id == segment_id and rep.status == "active":
                sev_mult = {"critical": 0.6, "high": 0.4, "medium": 0.2, "low": 0.1}.get(rep.severity, 0.2)
                incident_penalty = max(incident_penalty, sev_mult)

        # 4. AI Multi-signal Classification
        traffic_lvl, cong_score, conf_score = AITrafficAnalyzer.classify_traffic(
            current_speed=agg_speed,
            reference_speed=ref_speed,
            historical_speed=hist_speed,
            observations_count=valid_obs_count,
            variance=variance,
            incident_penalty=incident_penalty,
            is_blocked=edge.is_blocked,
            dt=now
        )

        # Travel time calculation (distance / effective speed)
        effective_speed = max(3.0, agg_speed)
        travel_time_min = round((edge.distance_km / effective_speed) * 60.0, 1)

        coords = edge.coordinates
        if not coords or len(coords) < 2:
            u_node = self.graph.nodes.get(edge.u)
            v_node = self.graph.nodes.get(edge.v)
            if u_node and v_node:
                coords = [[u_node["lat"], u_node["lng"]], [v_node["lat"], v_node["lng"]]]
            else:
                coords = []

        return RoadSegmentIntelligence(
            segment_id=segment_id,
            road_name=edge.name,
            reference_speed_kmh=round(ref_speed, 1),
            current_average_speed_kmh=round(agg_speed, 1),
            historical_average_speed_kmh=round(hist_speed, 1),
            active_observations=valid_obs_count,
            traffic_level=traffic_lvl,
            congestion_score=cong_score,
            confidence_score=conf_score,
            estimated_travel_time_min=travel_time_min,
            last_updated=now,
            coordinates=coords,
            from_node=edge.u,
            to_node=edge.v,
            distance_km=edge.distance_km,
            is_blocked=edge.is_blocked
        )

    def get_segment_intelligence(self, segment_id: str) -> RoadSegmentIntelligence:
        """Returns fresh intelligence for a road segment."""
        with self._lock:
            intel = self._compute_segment_intelligence(segment_id)
            self._cached_intelligence[segment_id] = intel
            return intel

    def get_all_segments_intelligence(self) -> List[RoadSegmentIntelligence]:
        """Returns intelligence for all distinct road segments in the network."""
        with self._lock:
            results = []
            seen = set()
            for edge_id in self.graph.edges_by_id.keys():
                if edge_id.endswith("_rev"):
                    continue
                if edge_id in seen:
                    continue
                seen.add(edge_id)
                intel = self._compute_segment_intelligence(edge_id)
                self._cached_intelligence[edge_id] = intel
                results.append(intel)
            return results

    def get_nearby_segments(self, lat: float, lng: float, radius_km: float = 5.0) -> List[RoadSegmentIntelligence]:
        """Returns segments within a geographic radius."""
        from backend.app.routing.network_graph import haversine_distance
        all_intel = self.get_all_segments_intelligence()
        nearby = []
        for intel in all_intel:
            if intel.coordinates:
                mid_pt = intel.coordinates[len(intel.coordinates) // 2]
                d = haversine_distance(lat, lng, mid_pt[0], mid_pt[1])
                if d <= radius_km:
                    nearby.append(intel)
        return nearby

    def predict_segment_traffic(self, segment_id: str, horizon_minutes: int = 15) -> TrafficPrediction:
        """Generates AI traffic forecast for 15 or 30 minutes."""
        with self._lock:
            edge = self.graph.edges_by_id.get(segment_id)
            if not edge:
                edge = self.graph.edges_by_id.get(f"{segment_id}_rev")
            ref_speed = edge.speed_limit_kmh if edge else 50.0

            now = datetime.now(timezone.utc)
            target_time = now + timedelta(minutes=horizon_minutes)
            hist_future_speed = self.get_historical_average_speed(segment_id, target_time)

            intel = self._cached_intelligence.get(segment_id) or self._compute_segment_intelligence(segment_id)
            curr_speed = intel.current_average_speed_kmh
            recent = self._recent_speeds_history.get(segment_id, [curr_speed])

            return AITrafficAnalyzer.predict_traffic(
                segment_id=segment_id,
                recent_speeds=recent,
                current_speed=curr_speed,
                reference_speed=ref_speed,
                historical_future_speed=hist_future_speed,
                horizon_minutes=horizon_minutes
            )

    def add_road_condition_report(self, report: RoadConditionReport) -> RoadConditionReport:
        """Stores a new citizen/sensor road condition hazard report."""
        with self._lock:
            if not report.segment_id:
                matched = map_matcher.match_point(report.latitude, report.longitude)
                if matched:
                    report.segment_id = matched[0]
            self._reports[report.id] = report

            # Invalidate segment cache to incorporate new incident penalty
            if report.segment_id and report.segment_id in self.graph.edges_by_id:
                intel = self._compute_segment_intelligence(report.segment_id)
                self._cached_intelligence[report.segment_id] = intel
                self._sync_graph_edge(report.segment_id, intel)

            return report

    def get_all_reports(self) -> List[RoadConditionReport]:
        """Returns all active road condition reports."""
        with self._lock:
            return sorted(
                list(self._reports.values()),
                key=lambda r: r.timestamp,
                reverse=True
            )

    def get_analytics_summary(self) -> TrafficAnalyticsSummary:
        """Aggregates network-wide traffic analytics KPIs and top bottlenecks."""
        segments = self.get_all_segments_intelligence()
        if not segments:
            return TrafficAnalyticsSummary(
                network_average_speed_kmh=45.0,
                congested_segments_count=0,
                total_segments_count=0,
                active_observers_count=0,
                top_bottlenecks=[],
                congestion_distribution={},
                system_status="OPTIMAL",
                timestamp=datetime.now(timezone.utc)
            )

        speeds = [s.current_average_speed_kmh for s in segments]
        avg_speed = round(float(sum(speeds) / len(speeds)), 1)

        total_obs = sum(s.active_observations for s in segments)
        congested = [s for s in segments if s.traffic_level in ["Heavy", "Severe"]]

        # Congestion distribution
        distribution = {"Normal": 0, "Moderate": 0, "Heavy": 0, "Severe": 0}
        for s in segments:
            distribution[s.traffic_level] = distribution.get(s.traffic_level, 0) + 1

        # Sort top bottlenecks by highest congestion score
        sorted_bottlenecks = sorted(segments, key=lambda s: s.congestion_score, reverse=True)[:5]
        bottlenecks_data = [
            {
                "segment_id": s.segment_id,
                "name": s.road_name,
                "congestion_score": s.congestion_score,
                "current_speed_kmh": s.current_average_speed_kmh,
                "reference_speed_kmh": s.reference_speed_kmh,
                "traffic_level": s.traffic_level,
                "observations": s.active_observations,
                "confidence_score": s.confidence_score
            }
            for s in sorted_bottlenecks
        ]

        # Status
        congested_ratio = len(congested) / len(segments)
        if congested_ratio >= 0.35:
            sys_status = "CRITICAL_CONGESTION"
        elif congested_ratio >= 0.15:
            sys_status = "MODERATE_DELAY"
        else:
            sys_status = "OPTIMAL_FLOW"

        return TrafficAnalyticsSummary(
            network_average_speed_kmh=avg_speed,
            congested_segments_count=len(congested),
            total_segments_count=len(segments),
            active_observers_count=total_obs,
            top_bottlenecks=bottlenecks_data,
            congestion_distribution=distribution,
            system_status=sys_status,
            timestamp=datetime.now(timezone.utc)
        )


# Global singleton storage manager
traffic_storage = TrafficStorageManager(transport_graph)
