import { useEffect, useState } from "react";
import {
  getSeatUtilization,
  getFloorUtilization,
  type SeatUtilizationSummary,
  type FloorUtilization,
} from "../api/analytics";
import "./AnalyticsPage.css";

export function AnalyticsPage() {
  const [summary, setSummary] =
    useState<SeatUtilizationSummary | null>(null);
  const [floors, setFloors] =
    useState<FloorUtilization[]>([]);

  useEffect(() => {
    getSeatUtilization().then(setSummary);
    getFloorUtilization().then(setFloors);
  }, []);

  if (!summary) {
    return (
      <div className="analytics-container">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">
        Seat Utilization Overview
      </h2>

      <div className="analytics-stats">
        <Stat label="Total Seats" value={summary.totalSeats} />
        <Stat label="Occupied" value={summary.occupiedSeats} />
        <Stat label="Available" value={summary.availableSeats} />
        <Stat label="Locked" value={summary.lockedSeats} />
        <Stat
          label="Utilization"
          value={`${summary.utilizationPercent}%`}
        />
      </div>

      <h3 className="floor-title">By Floor</h3>

      <div className="floor-list">
        {floors.map((f) => (
          <div key={f.floorId} className="floor-card">
            <div className="floor-header">
              <strong>{f.floorName}</strong>
              <span>{f.utilizationPercent}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${f.utilizationPercent}%`,
                }}
              />
            </div>

            <div className="floor-meta">
              <span>Total: {f.totalSeats}</span>
              <span>Occupied: {f.occupiedSeats}</span>
              <span>Available: {f.availableSeats}</span>
              <span>Locked: {f.lockedSeats}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}