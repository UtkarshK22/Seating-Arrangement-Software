import { useEffect, useState } from "react";
import api from "../api/http";


type User = {
  id: string;
  fullName: string;
};

type Props = {
  seatId: string;
  seatCode: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ReassignSeatModal({
  seatId,
  seatCode,
  onClose,
  onSuccess,
}: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<User[]>("/users")
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const handleReassign = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      await api("/seat-assignments/reassign", {
        method: "POST",
        body: JSON.stringify({
          targetSeatId: seatId,
          userId: selectedUserId,
        }),
      });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3>Reassign Seat {seatCode}</h3>

        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
        >
          <option value="">Select user</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 16 }}>
          <button onClick={handleReassign} disabled={loading}>
            Reassign
          </button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modal = {
  background: "#020617",
  padding: 24,
  borderRadius: 8,
  minWidth: 320,
};
