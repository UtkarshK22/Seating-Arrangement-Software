import api from "./http";

//  Admin assign seat to specific user
export function assignSeatToUser(seatId: string, userId: string) {
  return api(`/seat-assignments/${seatId}/assign/${userId}`, {
    method: "POST",
  });
}

//  Unassign specific seat
export function unassignSeat(seatId: string) {
  return api(`/seat-assignments/${seatId}/unassign`, {
    method: "POST",
  });
}