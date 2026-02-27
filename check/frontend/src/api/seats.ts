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
  floorId: string
): Promise<FloorMapResponse> {
  return api<FloorMapResponse>(`/floors/${floorId}/map`);
}

export async function toggleSeatLock(
  seatId: string,
  isLocked: boolean
) {
  return api(`/seats/${seatId}/lock`, {
    method: "PATCH",
    body: JSON.stringify({ isLocked }),
  });
}