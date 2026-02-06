import { useEffect, useState } from "react";
import { getSeatAudit } from "../api/seatAudit";
import type { SeatAuditLog } from "../api/seatAudit";
import { useAuth } from "../hooks/useAuth";
import { canViewSeatAudit } from "../utils/permissions";

type Props = {
  seatId: string;
};

export function SeatAuditTable({ seatId }: Props) {
  const { user } = useAuth();

  const [logs, setLogs] = useState<SeatAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !canViewSeatAudit(user.role)) return;

    let mounted = true;

    getSeatAudit(seatId)
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [seatId, user]);

  if (!user || !canViewSeatAudit(user.role)) {
    return null;
  }

  if (loading) return <p>Loading audit…</p>;
  if (!logs.length) return <p>No history found</p>;

  return (
    <table style={{ width: "100%", marginTop: 12 }}>
      <thead>
        <tr>
          <th>Action</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.action}</td>
            <td>{new Date(log.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
