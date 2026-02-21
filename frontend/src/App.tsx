import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "./api/http";
import { getMySeat } from "./api/seat";
import { useAuth } from "./auth/useAuth";
import ReassignSeatModal from "./components/ReassignSeatModal";
import { can } from "./auth/can";
import { MySeatInfoCard } from "./components/MySeatInfoCard";
import FloorMapCanvas from "./components/FloorMapCanvas";

/* ===================== TYPES ===================== */

type Floor = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

type SeatType = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

type FloorMapResponse = {
  floor: Floor;
  seats: SeatType[];
};

/* ===================== UI HELPERS ===================== */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

/* ===================== APP ===================== */

function App() {
  const { floorId } = useParams<{ floorId: string }>();

  const [floor, setFloor] = useState<Floor | null>(null);
  const [seats, setSeats] = useState<SeatType[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<SeatType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [mySeatId, setMySeatId] = useState<string | null>(null);

  const { user, isLoading } = useAuth();

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignSeat, setReassignSeat] = useState<SeatType | null>(null);

  /* ===================== LOAD FLOOR MAP ===================== */

  const loadFloorMap = async () => {
    if (!floorId) return;

    try {
      const [floorData, mySeat] = await Promise.all([
        api<FloorMapResponse>(`/floors/${floorId}/map`),
        getMySeat(),
      ]);

      setFloor(floorData.floor);
      setSeats(floorData.seats);

      if (mySeat) {
        setMySeatId(mySeat.seatId);
        setSelectedSeat(
          floorData.seats.find((s) => s.id === mySeat.seatId) ?? null
        );
      } else {
        setMySeatId(null);
        setSelectedSeat(null);
      }
    } catch {
      setError("Failed to load floor map");
    }
  };

  useEffect(() => {
    loadFloorMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  /* ===================== ACTIONS ===================== */

  const handleAssignSeat = async () => {
    if (!selectedSeat) return;

    setLoadingAction(true);
    setError(null);

    try {
      await api("/seat-assignments/assign", {
        method: "POST",
        body: JSON.stringify({ seatId: selectedSeat.id }),
      });
      await loadFloorMap();
    } catch {
      setError("Assignment failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUnassignSeat = async () => {
    if (!selectedSeat || selectedSeat.id !== mySeatId) return;

    const confirmed = window.confirm(
      "Are you sure you want to unassign this seat?"
    );
    if (!confirmed) return;

    setLoadingAction(true);
    setError(null);

    try {
      await api("/seat-assignments/unassign", { method: "POST" });
      await loadFloorMap();
    } catch {
      setError("Unassign failed");
    } finally {
      setLoadingAction(false);
    }
  };

  /* ===================== UI STATES ===================== */

  if (isLoading || !user) return null;
  if (!floorId) return <div style={{ padding: 32 }}>Invalid floor</div>;
  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!floor) return <div style={{ padding: 32 }}>Loading floor…</div>;

  const safeFloor = floor;
  const { role } = user;

  /* ===================== UI ===================== */

  return (
    <div
      style={{
        padding: 32,
        color: "#e5e7eb",
        background: "#020617",
        minHeight: "100vh",
      }}
    >
      <h1>{safeFloor.name}</h1>

      <MySeatInfoCard />

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <LegendDot color="#22c55e" label="Available" />
        <LegendDot color="#dc2626" label="Occupied" />
        <LegendDot color="#2563eb" label="My Seat" />
        <LegendDot color="#6b7280" label="Locked" />
      </div>

      {/* 🔥 Refactored Canvas Component */}
      <FloorMapCanvas
        floor={safeFloor}
        seats={seats}
        selectedSeatId={selectedSeat?.id ?? null}
        mySeatId={mySeatId}
        onSeatSelect={setSelectedSeat}
      />

      {selectedSeat && (
        <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
          {can(role, "SEAT_ASSIGN_SELF") && (
            <button
              onClick={handleAssignSeat}
              disabled={
                loadingAction ||
                selectedSeat.isOccupied ||
                selectedSeat.isLocked
              }
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                background: "#6366f1",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {loadingAction ? "Processing..." : "Assign to Me"}
            </button>
          )}

          {can(role, "SEAT_ASSIGN_SELF") && (
            <button
              onClick={handleUnassignSeat}
              disabled={loadingAction || selectedSeat.id !== mySeatId}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "1px solid #475569",
                background: "transparent",
                color: "#e5e7eb",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Unassign
            </button>
          )}
        </div>
      )}

      {showReassignModal && reassignSeat && (
        <ReassignSeatModal
          seatId={reassignSeat.id}
          seatCode={reassignSeat.seatCode}
          onClose={() => {
            setShowReassignModal(false);
            setReassignSeat(null);
          }}
          onSuccess={loadFloorMap}
        />
      )}
    </div>
  );
}

export default App;