import * as Tooltip from "@radix-ui/react-tooltip";
import { useRef, useState } from "react";
import styles from "./Seat.module.css";

interface SeatProps {
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
  isSelected?: boolean;
  isEditMode?: boolean;
  isHighlighted?: boolean;
  disabled?: boolean;
  currentScale?: number;
  onClick?: () => void;
  onDragStart?: () => void;
  onDragEnd?: (x: number, y: number) => void;
}

export default function Seat({
  seatCode,
  x,
  y,
  isLocked,
  isOccupied,
  isSelected = false,
  isEditMode = false,
  isHighlighted = false,
  disabled = false,
  currentScale = 1,
  onClick,
  onDragStart,
  onDragEnd,
}: SeatProps) {
  const dragState = useRef<{
    startPointerX: number;
    startPointerY: number;
    parentRect: DOMRect;
  } | null>(null);

  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number } | null>(null);

  const getStatusClass = () => {
    if (isLocked) return styles.locked;

    // ✅ Highlight overrides normal occupied color
    if (isHighlighted) return styles.highlighted;

    if (isOccupied) return styles.occupied;
    return styles.available;
  };

  const getStatusLabel = () => {
    if (isLocked) return "Locked";
    if (isOccupied) return "Occupied";
    return "Available";
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode || disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const parent = (e.currentTarget as HTMLElement).parentElement;
    if (!parent) return;

    dragState.current = {
      startPointerX: e.clientX,
      startPointerY: e.clientY,
      parentRect: parent.getBoundingClientRect(),
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onDragStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const { startPointerX, startPointerY } = dragState.current;
    setDragOffset({
      dx: (e.clientX - startPointerX) / currentScale,
      dy: (e.clientY - startPointerY) / currentScale,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode || !dragState.current || disabled) return;

    const { startPointerX, startPointerY, parentRect } = dragState.current;
    dragState.current = null;
    setDragOffset(null);

    const deltaX = (e.clientX - startPointerX) / currentScale;
    const deltaY = (e.clientY - startPointerY) / currentScale;

    // Small movement = treat as click
    if (Math.abs(deltaX) < 4 && Math.abs(deltaY) < 4) {
      if (!disabled) onClick?.();
      return;
    }

    const scaledWidth = parentRect.width / currentScale;
    const scaledHeight = parentRect.height / currentScale;

    const newX = Math.min(100, Math.max(0, x + (deltaX / scaledWidth) * 100));
    const newY = Math.min(100, Math.max(0, y + (deltaY / scaledHeight) * 100));

    onDragEnd?.(newX, newY);
  };

  const visualLeft = dragOffset
    ? `calc(${x}% - 8px + ${dragOffset.dx}px)`
    : `calc(${x}% - 8px)`;

  const visualTop = dragOffset
    ? `calc(${y}% - 8px + ${dragOffset.dy}px)`
    : `calc(${y}% - 8px)`;

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={(e) => {
              e.stopPropagation();

              if (disabled) return;

              if (!isEditMode && !isLocked) {
                onClick?.();
              }
            }}
            className={`${styles.seat} ${getStatusClass()} ${
              isSelected ? styles.selected : ""
            }`}
            style={{
              position: "absolute",
              left: visualLeft,
              top: visualTop,
              cursor: disabled
                ? "not-allowed"
                : isEditMode
                ? dragOffset
                  ? "grabbing"
                  : "grab"
                : "pointer",
              zIndex: dragOffset ? 100 : isSelected ? 5 : 1,
              transition: dragOffset ? "none" : undefined,
              opacity: disabled ? 0.6 : 1,
            }}
          />
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className={styles.tooltip}
            side="top"
            align="center"
            sideOffset={6}
          >
            <div className={styles.tooltipTitle}>{seatCode}</div>
            <div className={styles.tooltipStatus}>{getStatusLabel()}</div>
            <Tooltip.Arrow className={styles.tooltipArrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}