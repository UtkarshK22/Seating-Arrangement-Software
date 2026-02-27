import api from "./http";

type Seat = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

type FloorMapResponse = {
  seats: Seat[];
};

export async function getFloorMap(floorId: string): Promise<FloorMapResponse> {
  return api<FloorMapResponse>(`/floors/${floorId}/map`);
}
