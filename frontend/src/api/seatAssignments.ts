import api from "./http";

export async function reassignSeat(
  userId: string,
  targetSeatId: string,
  force = false,
) {
  return api("/seat-assignments/reassign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      targetSeatId,
      force,
    }),
  });
}
export async function assignSeat(seatId: string) {
  return api("/seat-assignments/assign", {
    method: "POST",
    body: JSON.stringify({ seatId }),
  });
}

export async function unassignSeat() {
  return api("/seat-assignments/unassign", {
    method: "POST",
  });
}
