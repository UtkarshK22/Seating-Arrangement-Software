type SeatDotProps = {
  seat: {
    id: string;
    seatCode: string;
    x: number;
    y: number;
    isLocked: boolean;
    isOccupied: boolean;
    occupant?: { fullName: string } | null;
  };
  onClick: (seatId: string) => void;
};

export function SeatDot({ seat, onClick }: SeatDotProps) {
  return (
    <div
      onClick={() => onClick(seat.id)}
      title={
        seat.isOccupied
          ? `${seat.seatCode} - ${seat.occupant?.fullName}`
          : seat.seatCode
      }
      style={{
        position: "absolute",
        left: `${seat.x * 100}%`,
        top: `${seat.y * 100}%`,
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: seat.isOccupied ? "#ef4444" : "#22c55e",
        border: seat.isLocked ? "2px solid black" : "none",
        cursor: "pointer",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
