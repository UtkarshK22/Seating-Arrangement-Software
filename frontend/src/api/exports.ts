import api from "./http";

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
  return api<LastExportResponse | null>("/exports/last");
}

export async function getExportHistory() {
  return api<{ data: ExportHistoryItem[] }>("/exports/history");
}

export async function getSeatAuditDownloadUrl() {
  return api<{ url: string }>("/exports/seat-audit/download");
}

export async function downloadSeatAuditCSV() {
  const data = await getSeatAuditDownloadUrl();

  if (!data?.url) {
    throw new Error("Download URL not found");
  }

  window.open(data.url, "_blank");
}