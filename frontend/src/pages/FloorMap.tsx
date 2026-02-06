import { useEffect, useState } from "react";
import { getFloorMap } from "../api/floors";
import { assignSeat, unassignSeat } from "../api/seatAssignments";

type Seat = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

export default function FloorMap() {
  const FLOOR_ID = "8e35e5eb-340b-47a2-92d2-56d62534eddf";
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFloorMap(FLOOR_ID).then((data) => {
      setSeats(data.seats);
      setLoading(false);
    });
  }, []);

  async function handleSeatClick(seat: Seat) {
    if (seat.isLocked) return;

    try {
      if (seat.isOccupied) {
        await unassignSeat();
      } else {
        await assignSeat(seat.id);
      }

      const updated = await getFloorMap(FLOOR_ID);
      setSeats(updated.seats);
    } catch {
      alert("Seat action failed");
    }
  }

  if (loading) return <p>Loading floor…</p>;

  return (
    <div style={{ position: "relative", width: 800, height: 600 }}>
      {seats.map((seat) => (
        <div
          key={seat.id}
          onClick={() => handleSeatClick(seat)}
          style={{
            position: "absolute",
            left: `${seat.x * 100}%`,
            top: `${seat.y * 100}%`,
            width: 20,
            height: 20,
            borderRadius: "50%",
            cursor: seat.isLocked ? "not-allowed" : "pointer",
            backgroundColor: seat.isLocked
              ? "yellow"
              : seat.isOccupied
              ? "red"
              : "green",
          }}
          title={seat.seatCode}
        />
      ))}
    </div>
  );
}
