import api from "./http";

/* ===================== TYPES ===================== */

export type SeatUtilizationSummary = {
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  lockedSeats: number;
  utilizationPercent: number;
};

export type FloorUtilization = {
  floorId: string;
  floorName: string;
  totalSeats: number;
  occupiedSeats: number;
  availableSeats: number;
  lockedSeats: number;
  utilizationPercent: number;
};

/* ===================== API ===================== */

export function getSeatUtilization() {
  return api<SeatUtilizationSummary>("/analytics/seat-utilization");
}

export function getFloorUtilization() {
  return api<FloorUtilization[]>("/analytics/floor-utilization");
}
