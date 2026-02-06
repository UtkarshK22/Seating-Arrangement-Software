import api from './http';

export type LastExportResponse = {
  exportedAt: string;
};

export type ExportHistoryItem = {
  id: string;
  exportType: string;
  exportedAt: string;
  exportedBy: {
    id: string;
    fullName: string;
    email: string;
  };
};

export async function getLastExport() {
  return api<LastExportResponse | null>('/exports/last');
}

export async function getExportHistory() {
  return api<{ data: ExportHistoryItem[] }>('/exports/history');
}

export async function getSeatAuditDownloadUrl() {
  return api<{ url: string }>("/exports/seat-audit/download");
}

export function downloadSeatAuditCSV() {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Not authenticated");
  }

  window.open(
    `http://localhost:3000/exports/seat-audit`,
    "_blank"
  );
  
}