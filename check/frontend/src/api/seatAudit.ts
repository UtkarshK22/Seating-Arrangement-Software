import api from "./http";

export type SeatAuditLog = {
  id: string;
  action: "ASSIGN" | "UNASSIGN" | "MOVE" | "LOCK" | "UNLOCK";
  seatId: string;
  seatCode: string;
  userId?: string;
  actorId: string;
  fromSeatId?: string;
  toSeatId?: string;
  createdAt: string;
};

export type PaginatedAuditResponse = {
  data: SeatAuditLog[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function getSeatAudit(seatId: string) {
  return api<SeatAuditLog[]>(`/seat-audit/seat/${seatId}`);
}

export function getFloorAudit(
  floorId: string,
  page = 1,
  limit = 20,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (from) params.append("from", from);
  if (to) params.append("to", to);

  return api<PaginatedAuditResponse>(
    `/seat-audit/floor/${floorId}?${params.toString()}`,
  );
}

export async function exportFloorAuditCsv(
  floorId: string,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const res = await fetch(
    `/seat-audit/floor/${floorId}/export?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to export CSV");
  }

  return res.blob();
}
