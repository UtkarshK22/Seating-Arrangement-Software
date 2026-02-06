import type { Role } from "@auth/roles";
import { can } from "@auth/can";

type Seat = {
  id: string;
  isLocked: boolean;
  isOccupied: boolean;
  assignedUserId?: string | null;
};

type ContextInput = {
  seat: Seat;
  currentUserId: string;
  role: Role | undefined;
};

export function getSeatContext({
  seat,
  currentUserId,
  role,
}: ContextInput) {
  const isMine = seat.assignedUserId === currentUserId;

  return {
    canAssignSelf:
      !seat.isOccupied &&
      can(role, "SEAT_ASSIGN_SELF"),

    canUnassignSelf:
      seat.isOccupied &&
      isMine,

    canReassign:
      seat.isOccupied &&
      !isMine &&
      can(role, "SEAT_REASSIGN"),

    canLock:
      !seat.isLocked &&
      can(role, "SEAT_LOCK"),

    canUnlock:
      seat.isLocked &&
      can(role, "SEAT_LOCK"),
  };
}
