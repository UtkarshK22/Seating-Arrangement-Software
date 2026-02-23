import {
  TransformWrapper,
  TransformComponent,
  useControls,
  useTransformContext,
} from "react-zoom-pan-pinch";
import Seat from "./Seat";
import api from "@api/http";

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
  onSeatSelect: (seat: SeatType | null) => void;
  onSeatPositionChange: (id: string, x: number, y: number) => void;
  isEditMode: boolean;
  isAddSeatMode: boolean;
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
      <button onClick={() => zoomIn()} style={buttonStyle}>+</button>
      <button onClick={() => zoomOut()} style={buttonStyle}>−</button>
      <button onClick={() => resetTransform()} style={buttonStyle}>Reset</button>
    </div>
  );
}

/* ===================== SEAT LAYER ===================== */

function SeatLayer({
  floor,
  seats,
  selectedSeatId,
  mySeatId,
  onSeatSelect,
  onSeatPositionChange,
  isEditMode,
  isAddSeatMode,
}: Props) {
  const { transformState } = useTransformContext();
  const currentScale = transformState.scale;

  const handleBackgroundClick = async (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!isAddSeatMode) {
      onSeatSelect(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width);
    const y = ((e.clientY - rect.top) / rect.height);

    const seatCode = prompt("Enter seat code:");
    if (!seatCode) return;

    try {
      await api(`/seats/${floor.id}`, {
        method: "POST",
        body: JSON.stringify({ seatCode, x, y }),
      });

      window.location.reload();
    } catch {
      alert("Failed to create seat");
    }
  };

  return (
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
      onClick={handleBackgroundClick}
    >
      {seats.map((seat) => {
        const isMySeat = seat.id === mySeatId;
        const disabled = seat.isLocked || (seat.isOccupied && !isMySeat);

        return (
          <Seat
            key={seat.id}
            seatCode={seat.seatCode}
            x={seat.x * 100}
            y={seat.y * 100}
            isLocked={seat.isLocked}
            isOccupied={seat.isOccupied && !isMySeat}
            isSelected={selectedSeatId === seat.id}
            isEditMode={isEditMode}
            currentScale={currentScale}
            onDragStart={() => {}}
            onDragEnd={(newX, newY) => {
              onSeatPositionChange(seat.id, newX, newY);
            }}
            onClick={() => {
              if (disabled) return;
              onSeatSelect(seat);
            }}
          />
        );
      })}
    </div>
  );
}

/* ===================== CANVAS ===================== */

export default function FloorMapCanvas(props: Props) {
  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.6}
      maxScale={3}
      wheel={{ step: 0.1 }}
      doubleClick={{ disabled: true }}
      panning={{ disabled: props.isEditMode }}
    >
      <ZoomControls />
      <TransformComponent>
        <SeatLayer {...props} />
      </TransformComponent>
    </TransformWrapper>
  );
}