import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFloorMap } from "../api/floors";
import { assignSeat, unassignSeat } from "../api/seatAssignments";
import Seat from "../components/Seat";

type SeatType = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

export default function FloorMap() {
  const { floorId } = useParams<{ floorId: string }>();
  const [seats, setSeats] = useState<SeatType[]>([]);
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

  async function handleSeatClick(seat: SeatType) {
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
        <Seat
        key={seat.id}
        seatCode={seat.seatCode}
        x={seat.x}
        y={seat.y}
        isLocked={seat.isLocked}
        isOccupied={seat.isOccupied}
        onClick={() => handleSeatClick(seat)}
        />
      ))}
    </div>
  );
}