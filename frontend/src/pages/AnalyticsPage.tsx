import { useEffect, useState } from "react";
import {
  getSeatUtilization,
  getFloorUtilization,
  type SeatUtilizationSummary,
  type FloorUtilization,
} from "../api/analytics";


export function AnalyticsPage() {
    const [summary, setSummary] = useState<SeatUtilizationSummary | null>(null);
    const [floors, setFloors] = useState<FloorUtilization[]>([]);
    
    useEffect(() => {
    getSeatUtilization().then(setSummary);
    getFloorUtilization().then(setFloors);
}, []);

  if (!summary) return <p>Loading analytics...</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2>Seat Utilization</h2>

      <div style={{ display: "flex", gap: 16 }}>
        <Stat label="Total Seats" value={summary.totalSeats} />
        <Stat label="Occupied" value={summary.occupiedSeats} />
        <Stat label="Available" value={summary.availableSeats} />
        <Stat label="Utilization" value={`${summary.utilizationPercent}%`} />
      </div>

      <h3 style={{ marginTop: 32 }}>By Floor</h3>

      {floors.map((f) => (
        <div key={f.floorId} style={{ marginBottom: 12 }}>
          <strong>{f.floorName}</strong>
          <div
            style={{
              height: 12,
              background: "#e5e7eb",
              borderRadius: 6,
              overflow: "hidden",
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${f.utilizationPercent}%`,
                height: "100%",
                background: "#2563eb",
              }}
            />
          </div>
          <small>{f.utilizationPercent}% utilized</small>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        padding: 16,
        background: "#f8fafc",
        borderRadius: 8,
        minWidth: 140,
      }}
    >
      <strong>{value}</strong>
      <div>{label}</div>
    </div>
  );
}
