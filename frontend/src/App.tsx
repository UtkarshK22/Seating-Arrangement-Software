import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "./api/http";
import { getMySeat } from "./api/seat";
import { useAuth } from "./hooks/useAuth";
import ReassignSeatModal from "./components/ReassignSeatModal";

import {
  canAssignSeat,
  canReassignSeat,
  canUnassignSeat,
} from "./utils/permissions";


/* ===================== TYPES ===================== */

type Floor = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

type Seat = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

type FloorMapResponse = {
  floor: Floor;
  seats: Seat[];
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
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [mySeatId, setMySeatId] = useState<string | null>(null);
  const { user } = useAuth();
  const role = user?.role;
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignSeat, setReassignSeat] = useState<Seat | null>(null);

  
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

  /* ===================== STATES ===================== */

  if (!floorId) return <div style={{ padding: 32 }}>Invalid floor</div>;
  if (error) return <div style={{ padding: 32, color: "red" }}>{error}</div>;
  if (!floor) return <div style={{ padding: 32 }}>Loading floor…</div>;

  /* ===================== UI ===================== */

  return (
    <div style={{ padding: 32, color: "#e5e7eb", background: "#020617", minHeight: "100vh" }}>
      <h1>{floor.name}</h1>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <LegendDot color="#22c55e" label="Available" />
        <LegendDot color="#dc2626" label="Occupied" />
        <LegendDot color="#2563eb" label="My Seat" />
        <LegendDot color="#6b7280" label="Locked" />
      </div>

      <div
        style={{
          position: "relative",
          width: 900,
          aspectRatio: `${floor.width} / ${floor.height}`,
          backgroundImage: `url(${floor.imageUrl})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          border: "1px solid #374151",
        }}
      >
        {seats.map((seat) => {
          const isMySeat = seat.id === mySeatId;
          const disabled = seat.isLocked || (seat.isOccupied && !isMySeat);

          return (
            <div
              key={seat.id}
              onClick={() => {
                if (disabled) return;
                if (
                  seat.isOccupied &&
                  role &&
                  canReassignSeat(role)
                ) {
                  setReassignSeat(seat);
                  setShowReassignModal(true);
                } else {
                  setSelectedSeat(seat);
                }
              }}

              style={{
                position: "absolute",
                left: `${seat.x * 100}%`,
                top: `${seat.y * 100}%`,
                transform: "translate(-50%, -50%)",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: isMySeat
                    ? "#2563eb"
                    : seat.isLocked
                    ? "#6b7280"
                    : seat.isOccupied
                    ? "#dc2626"
                    : "#22c55e",
                }}
              />
            </div>
          );
        })}
      </div>

      {selectedSeat && role && (
  <div style={{ marginTop: 24 }}>
    {canAssignSeat(role) && (
      <button
        onClick={handleAssignSeat}
        disabled={
          loadingAction ||
          selectedSeat.isOccupied ||
          selectedSeat.isLocked
        }
      >
        Assign to Me
      </button>
    )}

    {canUnassignSeat(role) && (
      <button
        onClick={handleUnassignSeat}
        disabled={
          loadingAction || selectedSeat.id !== mySeatId
        }
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
