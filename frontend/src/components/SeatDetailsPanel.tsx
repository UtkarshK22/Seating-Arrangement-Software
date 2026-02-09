import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { getUsers } from "../api/users";
import { unassignSeat, reassignSeat } from "../api/seatAssignments";
import { toggleSeatLock } from "../api/seats";
import { SeatAuditTable } from "./SeatAuditTable";

/* AUTH & RBAC */
import { useAuth } from "@auth/useAuth";
import { getSeatContext } from "@seats/seatContext";

/* OPTIMISTIC UPDATES */
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
  isLocked: boolean;
  isOccupied: boolean;
  assignedUser: AssignedUser | null;
};

type User = {
  id: string;
  fullName: string;
};

type Props = {
  seat: Seat | null;
  moveFromSeat: Seat | null;
  onClose: () => void;
  onUpdated: () => void;
  onOptimisticUpdate: (
    seatId: string,
    assignedUser: AssignedUser | null
  ) => void;
  onOptimisticLockUpdate: (
    seatId: string,
    isLocked: boolean
  ) => void;
};

/* ===================== COMPONENT ===================== */

export function SeatDetailsPanel({
  seat,
  moveFromSeat,
  onClose,
  onUpdated,
  onOptimisticUpdate,
  onOptimisticLockUpdate,
}: Props) {
  const { user, isLoading } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ===================== LOAD USERS ===================== */

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!seat) return;

    setSelectedUserId(null);
    getUsers()
      .then(setUsers)
      .catch(() => toast.error("Failed to load users"));
  }, [seat, user, isLoading]);

   /* ===================== AUTH GUARD ===================== */

  if (isLoading) return null;
  if (!user) return null;

  /* ===================== SEAT CONTEXT ===================== */

  const ctx = seat
    ? getSeatContext({
        seat: {
          id: seat.id,
          isLocked: seat.isLocked,
          isOccupied: seat.isOccupied,
          assignedUserId: seat.assignedUser?.id ?? null,
        },
        currentUserId: user.id,
        role: user.role,
      })
    : null;

  /* ===================== ASSIGN ===================== */

  async function handleAssign(override = false) {
    if (!seat || !selectedUserId) {
      toast.error("Select a user");
      return;
    }

    const prevUser = seat.assignedUser;
    const selected = users.find(u => u.id === selectedUserId);

    const nextUser = selected
      ? {
          id: selected.id,
          fullName: selected.fullName,
          email: prevUser?.email ?? "",
        }
      : null;

    setLoading(true);

    try {
      await runOptimistic({
        optimistic: () =>
          onOptimisticUpdate(seat.id, nextUser),
        rollback: () =>
          onOptimisticUpdate(seat.id, prevUser),
        request: () =>
          reassignSeat(selectedUserId, seat.id, override),
        successMessage: "Seat assigned",
        errorMessage: "Assignment failed",
      });

      onUpdated();
      onClose();
    } catch (err: unknown) {
      const error = err as { status?: number };

      if (error?.status === 403 && seat.isLocked && !override) {
        if (window.confirm("Seat is locked. Override?")) {
          handleAssign(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  /* ===================== UNASSIGN ===================== */

  async function handleUnassign() {
    if (!seat?.assignedUser || loading) return;

    setLoading(true);

    try {
      await runOptimistic({
        optimistic: () =>
          onOptimisticUpdate(seat.id, null),
        rollback: () =>
          onOptimisticUpdate(seat.id, seat.assignedUser),
        request: () => unassignSeat(),
        successMessage: "Seat unassigned",
        errorMessage: "Unassign failed",
      });

      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  /* ===================== MOVE SEAT ===================== */

  async function handleMoveSeat(override = false) {
    if (!seat || !moveFromSeat?.assignedUser) return;

    const movingUser = moveFromSeat.assignedUser;

    setLoading(true);

    try {
      await runOptimistic({
        optimistic: () => {
          onOptimisticUpdate(moveFromSeat.id, null);
          onOptimisticUpdate(seat.id, movingUser);
        },
        rollback: () => {
          onOptimisticUpdate(moveFromSeat.id, movingUser);
          onOptimisticUpdate(seat.id, seat.assignedUser);
        },
        request: () =>
          reassignSeat(movingUser.id, seat.id, override),
        successMessage: "Seat reassigned",
        errorMessage: "Reassignment failed",
      });

      onUpdated();
      onClose();
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error?.status === 403 && seat.isLocked && !override) {
        if (window.confirm("Target seat is locked. Override?")) {
          handleMoveSeat(true);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  /* ===================== LOCK / UNLOCK ===================== */

  async function handleToggleLock() {
    if (!seat) return;

    const next = !seat.isLocked;

    setLoading(true);

    try {
      await runOptimistic({
        optimistic: () =>
          onOptimisticLockUpdate(seat.id, next),
        rollback: () =>
          onOptimisticLockUpdate(seat.id, seat.isLocked),
        request: () =>
          toggleSeatLock(seat.id, next),
        successMessage: next ? "Seat locked" : "Seat unlocked",
        errorMessage: "Failed to update lock",
      });

      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  /* ===================== UI ===================== */

  return (
    <div
      style={{
        width: 340,
        height: "100vh",
        position: "fixed",
        right: 0,
        top: 0,
        background: "#f8f9fa",
        borderLeft: "1px solid #ddd",
        padding: 16,
        overflowY: "auto",
      }}
    >
      {!seat ? (
        <p>Select a seat</p>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>Seat {seat.seatCode}</h3>
            <button onClick={onClose}>✕</button>
          </div>

          <p><strong>Status:</strong> {seat.isOccupied ? "Occupied" : "Vacant"}</p>
          <p><strong>Locked:</strong> {seat.isLocked ? "Yes" : "No"}</p>

          <hr style={{ margin: "16px 0" }} />
          <h4>Seat History</h4>
          <SeatAuditTable seatId={seat.id} />

          {ctx?.canReassign &&
            moveFromSeat &&
            moveFromSeat.id !== seat.id &&
            moveFromSeat.assignedUser && (
              <button
                onClick={() => handleMoveSeat()}
                disabled={loading}
                style={{ marginTop: 12 }}
              >
                Move {moveFromSeat.assignedUser.fullName} here
              </button>
            )}

          {(ctx?.canLock || ctx?.canUnlock) && (
            <button
              onClick={handleToggleLock}
              disabled={loading}
              style={{ marginTop: 12 }}
            >
              {seat.isLocked ? "Unlock Seat" : "Lock Seat"}
            </button>
          )}

          {ctx?.canUnassignSelf && (
            <button
              onClick={handleUnassign}
              disabled={loading}
              style={{ marginTop: 12 }}
            >
              Unassign
            </button>
          )}

          {ctx?.canAssignSelf && (
            <>
              <select
                value={selectedUserId ?? ""}
                disabled={loading}
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ width: "100%", marginTop: 12 }}
              >
                <option value="">-- Select user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleAssign()}
                disabled={loading}
                style={{ marginTop: 12 }}
              >
                Assign Seat
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
