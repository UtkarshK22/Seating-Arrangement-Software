import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  getFloorAudit,
  exportFloorAuditCsv,
} from "../api/seatAudit";
import type { SeatAuditLog } from "../api/seatAudit";

import { getLastExport, getExportHistory } from "../api/exports";
import type { ExportHistoryItem } from "../api/exports";

import { useAuth } from "../auth/useAuth";
import { can } from "../auth/can";

/* ========================
   Minimal HTTP error shape
======================== */
type HttpError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

export default function AuditPage() {
  const { floorId } = useParams<{ floorId: string }>();
  const { user, isLoading } = useAuth();

  const [logs, setLogs] = useState<SeatAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const [lastExport, setLastExport] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  /* ========================
     Fetch audit logs
  ======================== */
  useEffect(() => {
    if (isLoading) return;
    if (!floorId) return;
    if (!user) return;
    if (!can(user.role, "VIEW_AUDIT_LOGS")) return;

    let cancelled = false;

    getFloorAudit(floorId, page, 20, from, to)
      .then((res) => {
        if (cancelled) return;
        setLogs(res.data);
        setTotalPages(res.totalPages);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [floorId, page, from, to, user, isLoading]);

  /* ========================
     Fetch last export
  ======================== */
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!can(user.role, "VIEW_AUDIT_LOGS")) return;

    getLastExport()
      .then((data) => setLastExport(data ? data.exportedAt : null))
      .catch(() => setLastExport(null));
  }, [user, isLoading]);

  /* ========================
     Fetch export history
  ======================== */
  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!can(user.role, "VIEW_AUDIT_LOGS")) return;

    getExportHistory()
      .then((res) => setExportHistory(res.data))
      .catch(() => setExportHistory([]));
  }, [user, isLoading]);

  /* ========================
     Guards
  ======================== */
  if (isLoading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  if (!floorId) {
    return <div style={{ padding: 24 }}>Invalid floor</div>;
  }

  if (!user || !can(user.role, "VIEW_AUDIT_LOGS")) {
    return (
      <div style={{ padding: 24 }}>
        Seat audit history is available to administrators only.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Loading audit…</div>;
  }

  /* ========================
     UI
  ======================== */
  return (
    <div style={{ padding: 24 }}>
      <h2>Floor Audit</h2>

      <button
        style={{ marginBottom: 6 }}
        disabled={!!cooldownMessage}
        onClick={async () => {
          if (!floorId) return;

          try {
            const blob = await exportFloorAuditCsv(floorId, from, to);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `floor-audit-${floorId}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            setCooldownMessage(null);

            const latest = await getLastExport();
            setLastExport(latest ? latest.exportedAt : null);

            const history = await getExportHistory();
            setExportHistory(history.data);
          } catch (e: unknown) {
            const err = e as HttpError;
            if (err.response?.status === 409) {
              setCooldownMessage(
                err.response.data?.message ??
                  "Export cooldown active. Please try again later."
              );
            }
          }
        }}
      >
        Export CSV
      </button>

      {cooldownMessage && (
        <div style={{ fontSize: 13, color: "#b45309", marginBottom: 8 }}>
          {cooldownMessage}
        </div>
      )}

      <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        {lastExport
          ? `Last exported on ${new Date(lastExport).toLocaleString()}`
          : "No exports performed yet"}
      </div>

      <h3 style={{ marginTop: 24 }}>Export History</h3>

      {!exportHistory.length && (
        <p style={{ fontSize: 13, color: "#666" }}>
          No exports performed yet.
        </p>
      )}

      <ul style={{ fontSize: 14 }}>
        {exportHistory.map((item) => (
          <li key={item.id}>
            {item.exportType} — {item.exportedBy.fullName} —{" "}
            {new Date(item.exportedAt).toLocaleString()}
          </li>
        ))}
      </ul>

      <div style={{ marginBottom: 16 }}>
        <label>
          From:{" "}
          <input
            type="date"
            value={from ?? ""}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value || undefined);
              setLoading(true);
            }}
          />
        </label>

        <label style={{ marginLeft: 12 }}>
          To:{" "}
          <input
            type="date"
            value={to ?? ""}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value || undefined);
              setLoading(true);
            }}
          />
        </label>
      </div>

      {!logs.length && <p>No activity</p>}

      <ul>
        {logs.map((log) => (
          <li key={log.id}>
            {log.action} – {log.seatCode} –{" "}
            {new Date(log.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        <button
          disabled={page === 1}
          onClick={() => {
            setLoading(true);
            setPage((p) => p - 1);
          }}
        >
          Previous
        </button>

        <span style={{ margin: "0 12px" }}>
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => {
            setLoading(true);
            setPage((p) => p + 1);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
