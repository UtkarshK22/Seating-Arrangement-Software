import { useEffect, useState } from "react";
import { getMySeat } from "../api/seat";
import { useAuth } from "../auth/useAuth";

type MySeatInfo = {
  seatCode: string;
};

export function MySeatInfoCard() {
  const { user, isLoading } = useAuth();
  const [mySeat, setMySeat] = useState<MySeatInfo | null>(null);

  const isEmployee =
    user?.role === "EMPLOYEE" || user?.role === "MANAGER";

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (!isEmployee) return;

    let mounted = true;

    getMySeat()
      .then((res) => {
        if (!mounted) return;

        if (!res) {
          setMySeat(null);
        } else {
          setMySeat({
            seatCode: res.seatCode,
          });
        }
      });

    return () => {
      mounted = false;
    };
  }, [user, isLoading, isEmployee]);

  if (isLoading) return null;
  if (!user) return null;
  if (!isEmployee) return null;
  if (!mySeat) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 8,
        background: "#0f172a",
        border: "1px solid #1e293b",
        color: "#e5e7eb",
        maxWidth: 420,
      }}
    >
      <div style={{ fontSize: 13, color: "#94a3b8" }}>
        Your Assigned Seat
      </div>

      <div style={{ marginTop: 6, fontSize: 15 }}>
        <strong>Seat:</strong> {mySeat.seatCode}
      </div>
    </div>
  );
}
