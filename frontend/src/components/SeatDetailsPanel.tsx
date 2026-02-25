import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../api/http";
import { hasPermission } from "../auth/permissions";
import { useAuth } from "../auth/useAuth";

/* ===================== TYPES ===================== */

type AssignedUser = {
  id: string;
  fullName: string;
  email: string;
};

type Seat = {
  id: string;
  seatCode: string;
  x?: number;
  y?: number;
  isLocked: boolean;
  isOccupied: boolean;
  assignedUser?: AssignedUser | null;
};

type Props = {
  seat: Seat;
  moveFromSeat: Seat | null;
  onClose: () => void;
  onRefresh: () => void;
  onOptimisticUpdate: (
    seatId: string,
    assignedUser: AssignedUser | null
  ) => void;
  onOptimisticLockUpdate: (seatId: string, isLocked: boolean) => void;
};

/* ===================== COMPONENT ===================== */

export default function SeatDetailsPanel({
  seat,
  onClose,
  onRefresh,
  onOptimisticUpdate,
  onOptimisticLockUpdate,
}: Props) {
  const [occupant, setOccupant] = useState<AssignedUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmUnassign, setConfirmUnassign] = useState(false);
  const [users, setUsers] = useState<AssignedUser[]>([]);
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const canLock = hasPermission(user?.role, "SEAT_LOCK");
  const canAssignOthers = hasPermission(user?.role, "SEAT_ASSIGN_OTHERS");
  const canAssignSelf = hasPermission(user?.role, "SEAT_ASSIGN_SELF");

  /* ===================== LOAD OCCUPANT + USERS ===================== */

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [seatUser, allUsers] = await Promise.all([
          api<AssignedUser | null>(`/seat-assignments/seat/${seat.id}`),
          api<AssignedUser[]>(`/users`),
        ]);

        setOccupant(seatUser);
        setUsers(allUsers);
      } catch {
        toast.error("Failed to load seat data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seat.id]);

  /* ===================== UNASSIGN ===================== */

  async function handleUnassign() {
    if (!occupant) return;

    setActionLoading(true);

    try {
      onOptimisticUpdate(seat.id, null);

      await api(`/seat-assignments/unassign/seat/${seat.id}`, {
        method: "POST",
      });

      toast.success("Seat unassigned");
      setOccupant(null);
    } catch {
      toast.error("Failed to unassign");
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  }

  /* ===================== ASSIGN USER ===================== */

  async function handleAssign(user: AssignedUser) {
    setActionLoading(true);

    try {
      onOptimisticUpdate(seat.id, user);

      await api(`/seat-assignments/${seat.id}/assign/${user.id}`, {
        method: "POST",
      });

      toast.success("User assigned");
      setOccupant(user);
    } catch {
      toast.error("Assignment failed");
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  }

    /* ===================== ASSIGN SELF ===================== */
  async function handleAssignSelf() {
  if (!user) return;

  setActionLoading(true);

  try {
    const selfUser: AssignedUser = {
      id: user.id,
      fullName: "You",
      email: "",
    };

    onOptimisticUpdate(seat.id, selfUser);

    await api(`/seat-assignments/${seat.id}/assign/${user.id}`, {
      method: "POST",
    });

    toast.success("Seat assigned to you");
    setOccupant(selfUser);
  } catch {
    toast.error("Assignment failed");
    onRefresh();
  } finally {
    setActionLoading(false);
  }
}

  /* ===================== LOCK / UNLOCK ===================== */

  async function handleToggleLock() {
    setActionLoading(true);

    try {
      onOptimisticLockUpdate(seat.id, !seat.isLocked);

      await api(`/seats/${seat.id}/lock`, {
        method: "PATCH",
        body: JSON.stringify({ isLocked: !seat.isLocked }),
      });

      toast.success(seat.isLocked ? "Seat unlocked" : "Seat locked");
    } catch {
      toast.error("Failed to update lock state");
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  }

  /* ===================== FILTER USERS ===================== */

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(query.toLowerCase())
  );

  /* ===================== UI ===================== */

  return (
    <>
      <div
        style={{
          width: 340,
          padding: 20,
          borderLeft: "1px solid var(--border-color)",
          background: "var(--panel-bg)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          transition: "all 0.25s ease",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ fontWeight: 600 }}>{seat.seatCode}</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {/* STATUS */}
        <div>
          <strong>Status:</strong>{" "}
          {seat.isLocked
            ? "Locked"
            : occupant
            ? "Occupied"
            : "Available"}
        </div>

        {/* OCCUPANT */}
        {loading ? (
          <div>Loading...</div>
        ) : occupant ? (
          <div
            style={{
              padding: 12,
              background: "var(--card-bg, #f3f4f6)",
              borderRadius: 6,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {occupant.fullName}
            </div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              {occupant.email}
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.6 }}>
            No user assigned
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* LOCK */}
          {canLock && (
            <button
              onClick={handleToggleLock}
              disabled={actionLoading}
              style={{
                padding: 10,
                background: seat.isLocked ? "#16a34a" : "#111827",
                color: "#fff",
                borderRadius: 6,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading
                ? "Processing..."
                : seat.isLocked
                ? "Unlock Seat"
                : "Lock Seat"}
            </button>
          )}
          
          {/* UNASSIGN */}
          {occupant && canAssignOthers && (
            <button
              onClick={() => setConfirmUnassign(true)}
              disabled={actionLoading}
              style={{
                padding: 10,
                background: "#dc2626",
                color: "#fff",
                borderRadius: 6,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              Unassign User
            </button>
          )}
        </div>

        {/* ASSIGN SELF */}
        {canAssignSelf && !occupant && !seat.isLocked && (
            <button
            onClick={handleAssignSelf}
            disabled={actionLoading}
            style={{
                padding: 10,
                background: "#2563eb",
                color: "#fff",
                borderRadius: 6,
                opacity: actionLoading ? 0.6 : 1,
          
            }}
          >
              Assign to Me
            </button>
      )}

        {/* USER SEARCH + ASSIGN */}
        {!seat.isLocked && canAssignOthers && (
          <>
            <hr />

            <input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid var(--border-color)",
                background: "var(--input-bg, transparent)",
              }}
            />

            <div
              style={{
                maxHeight: 160,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleAssign(user)}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    cursor: "pointer",
                    background:
                      occupant?.id === user.id
                        ? "#2563eb"
                        : "transparent",
                    color:
                      occupant?.id === user.id
                        ? "#fff"
                        : "inherit",
                  }}
                >
                  {user.fullName}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmUnassign && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--panel-bg)",
              padding: 24,
              borderRadius: 8,
              width: 300,
            }}
          >
            <h4>Unassign User?</h4>
            <p style={{ marginTop: 8 }}>
              This will remove the user from this seat.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button onClick={() => setConfirmUnassign(false)}>
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmUnassign(false);
                  handleUnassign();
                }}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 6,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}