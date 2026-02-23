import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFloorMap } from "../api/floors";
import { assignSeatToUser, unassignSeat } from "../api/seatAssignments";
import Seat from "../components/Seat";
import { UserList } from "../components/UserList";
import api from "../api/http";

type User = {
  id: string;
  fullName: string;
};

type SeatType = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
  assignedUser?: {
    id: string;
    fullName: string;
  } | null;
};

export default function FloorMap() {
  const { floorId } = useParams<{ floorId: string }>();

  const [seats, setSeats] = useState<SeatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] =
    useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  // Fetch floor map
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

  // Fetch users (admin)
  useEffect(() => {
    api<User[]>("/users").then((data) => {
      setUsers(data);
    });
  }, []);

  async function handleSeatClick(seat: SeatType) {
    if (!floorId) return;
    if (seat.isLocked) return;
    if (actionLoading) return;

    if (!seat.isOccupied && !selectedUserId) {
      alert("Select a user first");
      return;
    }

    try {
      setActionLoading(true);

      if (seat.isOccupied) {
        await unassignSeat(seat.id);
      } else {
        await assignSeatToUser(seat.id, selectedUserId!);
      }

      const updated = await getFloorMap(floorId);
      setSeats(updated.seats);
    } catch {
      alert("Seat action failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <p>Loading floor…</p>;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <UserList
        users={users}
        selectedUserId={selectedUserId}
        onUserClick={setSelectedUserId}
      />

      <div>
        <div style={{ position: "relative", width: 800, height: 600 }}>
          {seats.map((seat) => {
            const isSelectedUsersSeat =
              selectedUserId !== null &&
              seat.assignedUser?.id === selectedUserId;

            return (
              <Seat
                key={seat.id}
                seatCode={seat.seatCode}
                x={seat.x}
                y={seat.y}
                isLocked={seat.isLocked}
                isOccupied={seat.isOccupied}
                isHighlighted={Boolean(isSelectedUsersSeat)}
                disabled={actionLoading}
                onClick={() => handleSeatClick(seat)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}