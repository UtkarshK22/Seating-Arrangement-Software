import { useEffect, useState } from "react";
import { getSeatUtilization } from "../api/analytics";
import { useAuth } from "../auth/useAuth";
import { downloadSeatAuditCSV } from "../api/exports";
import { getSeatAuditDownloadUrl } from "../api/exports";

/* ===================== TYPES ===================== */

type SeatUtilization = {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  utilizationPercent: number;
};

/* ===================== COMPONENT ===================== */

export default function AdminDashboard() {
  const { user } = useAuth();

  const [data, setData] = useState<SeatUtilization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ===================== LOAD ANALYTICS ===================== */

  useEffect(() => {
    // User not ready yet — do not hang UI
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadAnalytics() {
      try {
        const res = await getSeatUtilization();
        if (!cancelled) {
          setData(res);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load analytics");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    <button
    onClick={async () => {
      const res = await getSeatAuditDownloadUrl();
      window.open(res.url, "_blank");
    }}
    style={{
      marginTop: 24,
      padding: "10px 16px",
      fontSize: 14,
      }}
      >
        Download Seat Audit CSV
        </button>

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ===================== UI STATES ===================== */

  if (loading) {
    return <div style={{ padding: 24 }}>Loading analytics…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "red" }}>
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 24 }}>
        No analytics data available.
      </div>
    );
  }

  /* ===================== SUCCESS UI ===================== */

  return (
    <div style={{ padding: 24 }}>
      <h2>Seat Utilization</h2>

      <ul style={{ fontSize: 16 }}>
        <li>Total Seats: {data.totalSeats}</li>
        <li>Occupied Seats: {data.occupiedSeats}</li>
        <li>Available Seats: {data.availableSeats}</li>
        <li>Utilization: {data.utilizationPercent}%</li>
      </ul>

      <hr style={{ margin: "24px 0" }} />

      <button
        onClick={downloadSeatAuditCSV}
        style={{
          padding: "10px 16px",
          background: "#2563eb",
          color: "white",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
        }}
      >
        Export Seat Audit (CSV)
      </button>
    </div>
  );
}
