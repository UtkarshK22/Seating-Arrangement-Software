type Seat = {
  id: string;
  seatCode: string;
  isLocked: boolean;
};

type Props = {
  seats: Seat[];
  onSeatClick: (seatId: string) => void;
};

export function SeatGrid({ seats, onSeatClick }: Props) {
  return (
    <div>
      <h3>Seats</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {seats.map(seat => (
          <div
            key={seat.id}
            onClick={() => onSeatClick(seat.id)}
            style={{
              padding: "12px",
              border: "1px solid #ccc",
              cursor: "pointer",
              background: seat.isLocked ? "#fee2e2" : "#ecfeff",
            }}
          >
            {seat.seatCode}
          </div>
        ))}
      </div>
    </div>
  );
}
