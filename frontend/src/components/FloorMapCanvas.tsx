import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from "react-zoom-pan-pinch";
import Seat from "./Seat";

type Floor = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

type SeatType = {
  id: string;
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
};

type Props = {
  floor: Floor;
  seats: SeatType[];
  selectedSeatId: string | null;
  mySeatId: string | null;
  onSeatSelect: (seat: SeatType) => void;
};

/* ===================== ZOOM CONTROLS ===================== */

function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  const buttonStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#e5e7eb",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const hoverGlow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = "#6366f1";
    e.currentTarget.style.boxShadow =
      "0 0 14px rgba(99,102,241,0.6)";
  };

  const removeGlow = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.borderColor = "#334155";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <button
        onClick={() => zoomIn()}
        style={buttonStyle}
        onMouseEnter={hoverGlow}
        onMouseLeave={removeGlow}
      >
        +
      </button>

      <button
        onClick={() => zoomOut()}
        style={buttonStyle}
        onMouseEnter={hoverGlow}
        onMouseLeave={removeGlow}
      >
        −
      </button>

      <button
        onClick={() => resetTransform()}
        style={buttonStyle}
        onMouseEnter={hoverGlow}
        onMouseLeave={removeGlow}
      >
        Reset
      </button>
    </div>
  );
}

/* ===================== CANVAS ===================== */

export default function FloorMapCanvas({
  floor,
  seats,
  selectedSeatId,
  mySeatId,
  onSeatSelect,
}: Props) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.6}
      maxScale={3}
      wheel={{ step: 0.1 }}
      doubleClick={{ disabled: true }}
    >
      <ZoomControls />

      <TransformComponent>
        <div
          style={{
            position: "relative",
            width: 900,
            aspectRatio: `${floor.width} / ${floor.height}`,
            backgroundImage: `url(${floor.imageUrl})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            border: "1px solid #374151",
          }}
        >
          {seats.map((seat) => {
            const isMySeat = seat.id === mySeatId;
            const disabled =
              seat.isLocked || (seat.isOccupied && !isMySeat);

            return (
              <Seat
                key={seat.id}
                seatCode={seat.seatCode}
                x={seat.x * 100}
                y={seat.y * 100}
                isLocked={seat.isLocked}
                isOccupied={seat.isOccupied && !isMySeat}
                isSelected={selectedSeatId === seat.id}
                onClick={() => {
                  if (disabled) return;
                  onSeatSelect(seat);
                }}
              />
            );
          })}
        </div>
      </TransformComponent>
    </TransformWrapper>
  );
}