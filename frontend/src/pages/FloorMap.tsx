import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  const { floorId } = useParams<{ floorId: string }>();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!floorId) return;

    getFloorMap(floorId)
      .then((data) => {
        setSeats(data.seats);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [floorId]);

  async function handleSeatClick(seat: Seat) {
    if (!floorId) return;
    if (seat.isLocked) return;

    try {
      if (seat.isOccupied) {
        await unassignSeat();
      } else {
        await assignSeat(seat.id);
      }

      const updated = await getFloorMap(floorId);
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