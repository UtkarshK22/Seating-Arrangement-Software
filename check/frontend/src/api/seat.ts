import api from "./http";

export type MySeatResponse = {
  seatId: string;
  seatCode: string;
  x: number;
  y: number;
  floorId: string;
  floor: {
    id: string;
    width: number;
    height: number;
    imageUrl: string;
  };
};

export async function getMySeat() {
  return api<MySeatResponse | null>("/seat-assignments/me");
}
