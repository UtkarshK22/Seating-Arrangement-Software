import api from "./http";

type Seat = {
  id: string;
  seatCode: string;
  isLocked: boolean;
};

type Floor = {
  id: string;
  name: string;
  width: number;
  height: number;
  imageUrl: string;
};

type FloorMapResponse = {
  floor: Floor;
  seats: Seat[];
};

export async function getSeats(
  floorId: string,
): Promise<FloorMapResponse> {
  return api<FloorMapResponse>(`/floors/${floorId}/map`);
}
export async function toggleSeatLock(
  seatId: string,
  isLocked: boolean,
) {
  const res = await fetch(`http://localhost:3000/seats/${seatId}/lock`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ isLocked }),
  });

  if (!res.ok) {
    const error = new Error("Failed to update seat lock");
    // @ts-expect-error adding status to Error object
    error.status = res.status;
    throw error;
  }

  return res.json();
}

