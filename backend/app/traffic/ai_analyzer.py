"""
MARGSETU - AI Traffic Analyzer
Pure-NumPy statistical machine learning & time-series forecasting engine.
Handles speed aggregation, outlier rejection, multi-factor congestion scoring,
confidence evaluation, and 15/30-minute traffic prediction.
"""
import math
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional
import numpy as np

from backend.app.database.models import (
    AITrafficLevel,
    RoadSegmentIntelligence,
    TrafficPrediction,
    SpeedObservation,
)


class AITrafficAnalyzer:
    """
    Intelligent traffic classification and forecasting engine using NumPy vector math.
    """

    @staticmethod
    def filter_speed_outliers(speeds: List[float]) -> np.ndarray:
        """
        Filters speed observations using the Interquartile Range (IQR) rule.
        Removes sensor anomalies, GPS jitter, and long-idle parked vehicles.
        """
        if not speeds:
            return np.array([], dtype=float)

        arr = np.array(speeds, dtype=float)
        # Minimum physical validity check: 0 km/h to 160 km/h
        valid_mask = (arr >= 0.0) & (arr <= 160.0)
        arr = arr[valid_mask]

        if len(arr) < 4:
            # Not enough data points for statistical IQR, return valid array
            return arr

        q25, q75 = np.percentile(arr, [25, 75])
        iqr = q75 - q25
        lower_bound = max(2.0, q25 - 1.5 * iqr)
        upper_bound = q75 + 1.5 * iqr

        filtered = arr[(arr >= lower_bound) & (arr <= upper_bound)]
        if len(filtered) == 0:
            return arr  # Fallback to unfiltered valid if all rejected
        return filtered

    @staticmethod
    def aggregate_speed(speeds: List[float], reference_speed: float) -> Tuple[float, float, int]:
        """
        Computes robust aggregate speed from raw GPS telemetry.
        Returns: (aggregate_speed_kmh, speed_variance, valid_count)
        """
        if not speeds:
            return reference_speed, 0.0, 0

        clean = AITrafficAnalyzer.filter_speed_outliers(speeds)
        if len(clean) == 0:
            return reference_speed, 0.0, 0

        # Weighted combination of median (robust to noise) and mean
        median_val = float(np.median(clean))
        mean_val = float(np.mean(clean))
        variance_val = float(np.var(clean)) if len(clean) > 1 else 0.0

        # 60% median, 40% mean for balanced stability
        agg_speed = 0.6 * median_val + 0.4 * mean_val
        return max(3.0, round(agg_speed, 1)), round(variance_val, 2), len(clean)

    @staticmethod
    def get_diurnal_rush_factor(dt: Optional[datetime] = None) -> float:
        """
        Calculates diurnal rush hour intensity factor [0.0 - 0.35]
        Morning peak: 08:30 - 10:30
        Evening peak: 17:30 - 20:30
        """
        now = dt or datetime.now()
        hour_fraction = now.hour + now.minute / 60.0

        # Gaussian morning rush centered at 9.25 (09:15)
        morning_rush = 0.25 * math.exp(-0.5 * ((hour_fraction - 9.25) / 1.1) ** 2)
        # Gaussian evening rush centered at 18.75 (18:45)
        evening_rush = 0.35 * math.exp(-0.5 * ((hour_fraction - 18.75) / 1.3) ** 2)

        return min(0.40, morning_rush + evening_rush)

    @classmethod
    def classify_traffic(
        cls,
        current_speed: float,
        reference_speed: float,
        historical_speed: float,
        observations_count: int,
        variance: float = 0.0,
        incident_penalty: float = 0.0,
        is_blocked: bool = False,
        dt: Optional[datetime] = None
    ) -> Tuple[str, float, float]:
        """
        Classifies traffic into NORMAL, MODERATE, HEAVY, SEVERE.
        Computes Congestion Score (0 - 100) and Confidence Score (0 - 100%).
        
        Returns:
            traffic_level: str ("Normal", "Moderate", "Heavy", "Severe")
            congestion_score: float (0.0 to 100.0)
            confidence_score: float (0.0 to 100.0%)
        """
        if is_blocked:
            return AITrafficLevel.SEVERE.value, 100.0, 99.0

        ref_spd = max(10.0, reference_speed)
        curr_spd = max(1.0, current_speed)
        hist_spd = max(10.0, historical_speed)

        # 1. Primary Speed Ratio (current vs reference free-flow)
        speed_ratio = min(1.2, curr_spd / ref_spd)

        # 2. Historical Deviation Factor
        hist_ratio = min(1.2, curr_spd / hist_spd)

        # 3. Base Congestion from Speed Drop
        # If speed_ratio >= 0.85 -> minimal congestion (0 - 15)
        # If speed_ratio <= 0.25 -> severe congestion (75 - 100)
        raw_congestion = max(0.0, 1.0 - speed_ratio) * 100.0

        # Blend with historical deviation (if current is much lower than normal for this hour)
        if hist_ratio < 0.75:
            deviation_boost = (0.75 - hist_ratio) * 30.0
            raw_congestion += deviation_boost

        # Add incident / road condition penalty
        raw_congestion += incident_penalty * 40.0

        congestion_score = round(float(np.clip(raw_congestion, 0.0, 100.0)), 1)

        # Map Congestion Score to Traffic Level
        if congestion_score < 25.0:
            traffic_level = AITrafficLevel.NORMAL.value
        elif congestion_score < 55.0:
            traffic_level = AITrafficLevel.MODERATE.value
        elif congestion_score < 80.0:
            traffic_level = AITrafficLevel.HEAVY.value
        else:
            traffic_level = AITrafficLevel.SEVERE.value

        # Calculate Confidence Score based on observations and variance
        if observations_count >= 15:
            base_conf = 95.0
        elif observations_count >= 8:
            base_conf = 88.0
        elif observations_count >= 3:
            base_conf = 78.0
        elif observations_count >= 1:
            base_conf = 65.0
        else:
            # 0 active observations -> historical baseline fallback
            base_conf = 55.0

        # Variance penalty: high spread lowers confidence slightly
        var_penalty = min(15.0, (variance / (ref_spd + 1.0)) * 5.0)
        confidence_score = round(float(np.clip(base_conf - var_penalty, 35.0, 99.0)), 1)

        return traffic_level, congestion_score, confidence_score

    @classmethod
    def predict_traffic(
        cls,
        segment_id: str,
        recent_speeds: List[float],
        current_speed: float,
        reference_speed: float,
        historical_future_speed: float,
        horizon_minutes: int = 15
    ) -> TrafficPrediction:
        """
        Predicts traffic conditions 15 or 30 minutes into the future using
        double-exponential smoothing (Holt's linear trend) blended with
        historical diurnal baselines.
        """
        # Ensure we have a sequence for Holt's model
        if len(recent_speeds) < 3:
            history = [historical_future_speed, (current_speed + historical_future_speed) / 2.0, current_speed]
        else:
            history = recent_speeds[-8:]

        y = np.array(history, dtype=float)
        alpha = 0.45  # Level smoothing factor
        beta = 0.25   # Trend smoothing factor

        # Initialize level and trend
        level = y[0]
        trend = y[1] - y[0] if len(y) > 1 else 0.0

        for t in range(1, len(y)):
            prev_level = level
            level = alpha * y[t] + (1 - alpha) * (prev_level + trend)
            trend = beta * (level - prev_level) + (1 - beta) * trend

        # Steps ahead (assume each historical step represents ~3 minutes)
        h_steps = horizon_minutes / 3.0
        projected_speed = level + (h_steps * trend)

        # Blend with historical baseline for the predicted target time
        # 15m: 65% momentum + 35% historical
        # 30m: 40% momentum + 60% historical
        hist_weight = 0.35 if horizon_minutes <= 15 else 0.60
        blended_speed = (1.0 - hist_weight) * projected_speed + hist_weight * historical_future_speed
        blended_speed = float(np.clip(blended_speed, 5.0, reference_speed * 1.1))

        # Determine Trend
        speed_delta = blended_speed - current_speed
        if speed_delta > 3.0:
            trend_label = "IMPROVING"
        elif speed_delta < -3.0:
            trend_label = "WORSENING"
        else:
            trend_label = "STABLE"

        # Predict Congestion & Confidence
        traffic_level, cong_score, _ = cls.classify_traffic(
            current_speed=blended_speed,
            reference_speed=reference_speed,
            historical_speed=historical_future_speed,
            observations_count=len(recent_speeds),
            variance=float(np.var(y)) if len(y) > 1 else 0.0
        )

        # Prediction confidence diminishes slightly with longer horizon
        horizon_decay = 6.0 if horizon_minutes <= 15 else 14.0
        pred_confidence = round(float(np.clip(85.0 - horizon_decay, 40.0, 94.0)), 1)

        return TrafficPrediction(
            segment_id=segment_id,
            horizon_minutes=horizon_minutes,
            predicted_speed_kmh=round(blended_speed, 1),
            predicted_traffic_level=traffic_level,
            predicted_congestion_score=cong_score,
            confidence_score=pred_confidence,
            trend=trend_label,
            timestamp=datetime.now(timezone.utc)
        )
