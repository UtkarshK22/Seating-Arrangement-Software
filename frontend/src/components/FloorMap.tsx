import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { SeatDetailsPanel } from "./SeatDetailsPanel";
import { useParams } from "react-router-dom";
import { runOptimistic } from "@utils/optimistic";

/* ===================== TYPES ===================== */

type AssignedUser = {
  id: string;
  fullName: string;
  email: string;
};

type Seat = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
  assignedUser: AssignedUser | null;
};

type Floor = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

/* ===================== COMPONENT ===================== */

export function FloorMap() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [floor, setFloor] = useState<Floor | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [moveFromSeat, setMoveFromSeat] = useState<Seat | null>(null);

  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());

  const { floorId } = useParams<{ floorId: string }>();

  /* ===================== FETCH FLOOR MAP ===================== */

  function refreshFloorMap() {
    if (!floorId) return;

    fetch(`http://localhost:3000/floors/${floorId}/map`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(data => {
        setFloor(data.floor);
        setSeats(data.seats);
      })
      .catch(() => toast.error("Failed to load floor map"));
  }

  useEffect(() => {
    refreshFloorMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorId]);

  /* ===================== OPTIMISTIC UPDATES ===================== */

  function optimisticUpdateSeat(
    seatId: string,
    assignedUser: AssignedUser | null
  ) {
    setSeats(prev =>
      prev.map(seat =>
        seat.id === seatId
          ? {
              ...seat,
              isOccupied: Boolean(assignedUser),
              assignedUser,
            }
          : seat
      )
    );
  }

  function optimisticLockUpdate(seatId: string, isLocked: boolean) {
    setSeats(prev =>
      prev.map(seat =>
        seat.id === seatId ? { ...seat, isLocked } : seat
      )
    );
  }

  /* ===================== BULK SELECTION ===================== */

  function toggleSeatSelection(seatId: string) {
    setSelectedSeatIds(prev => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
      } else {
        next.add(seatId);
      }
      return next;
    });
  }

  async function handleAutoAssign() {
    if (selectedSeatIds.size === 0) return;

    try {
      await runOptimistic({
        optimistic: () => {},
        rollback: () => {},
        request: () =>
          fetch("http://localhost:3000/seat-assignments/auto-assign", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              seatIds: [...selectedSeatIds],
            }),
          }),
        successMessage: "Seats auto-assigned",
        errorMessage: "Auto-assignment failed",
      });

      setSelectedSeatIds(new Set());
      refreshFloorMap();
    } catch {
      // error handled by toast
    }
  }

  /* ===================== UI ===================== */

  if (!floorId) return <p>Invalid floor</p>;
  if (!floor) return <p>Loading floor...</p>;

  return (
    <div style={{ display: "flex" }}>
      <div
        onClick={() => {
          setSelectedSeat(null);
          setMoveFromSeat(null);
        }}
        style={{
          position: "relative",
          width: floor.width,
          height: floor.height,
          backgroundImage: `url(${floor.imageUrl})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          border: "1px solid #ccc",
        }}
      >
        {seats.map(seat => {
          const isSelected = selectedSeatIds.has(seat.id);

          const backgroundColor = seat.isLocked
            ? "#000000"
            : seat.isOccupied
            ? "#f97316"
            : "#22c55e";

          return (
            <div
              key={seat.id}
              onClick={(e) => {
                e.stopPropagation();

                if (e.ctrlKey) {
                  toggleSeatSelection(seat.id);
                  return;
                }

                setSelectedSeat(seat);
                setMoveFromSeat(seat.isOccupied ? seat : null);
              }}
              title={
                seat.isOccupied
                  ? `${seat.seatCode} - ${seat.assignedUser?.fullName}`
                  : seat.seatCode
              }
              style={{
                position: "absolute",
                left: `${seat.x * 100}%`,
                top: `${seat.y * 100}%`,
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor,
                border: isSelected
                  ? "3px solid #2563eb"
                  : selectedSeat?.id === seat.id
                  ? "3px solid #9333ea"
                  : "none",
                cursor: "pointer",
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}
      </div>

      {/* ================= SIDE PANEL ================= */}
      <SeatDetailsPanel
        seat={selectedSeat}
        moveFromSeat={moveFromSeat}
        onClose={() => {
          setSelectedSeat(null);
          setMoveFromSeat(null);
        }}
        onUpdated={refreshFloorMap}
        onOptimisticUpdate={optimisticUpdateSeat}
        onOptimisticLockUpdate={optimisticLockUpdate}
      />

      {/* ================= BULK ACTION BAR ================= */}
      {selectedSeatIds.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#020617",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            display: "flex",
            gap: 12,
          }}
        >
          <span>{selectedSeatIds.size} seats selected</span>
          <button onClick={handleAutoAssign}>Auto-Assign</button>
          <button onClick={() => setSelectedSeatIds(new Set())}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
