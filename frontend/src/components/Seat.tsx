import * as Tooltip from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import styles from "./Seat.module.css";

interface SeatProps {
  seatCode: string;
  x: number;
  y: number;
  isLocked: boolean;
  isOccupied: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function Seat({
  seatCode,
  x,
  y,
  isLocked,
  isOccupied,
  isSelected = false,
  onClick,
}: SeatProps) {
  const getStatusClass = () => {
    if (isLocked) return styles.locked;
    if (isOccupied) return styles.occupied;
    return styles.available;
  };

  const getStatusLabel = () => {
    if (isLocked) return "Locked";
    if (isOccupied) return "Occupied";
    return "Available";
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.div
            className={`${styles.seat} ${getStatusClass()} ${
                isSelected ? styles.selected : ""
              }`}
            
              animate={{
              scale: isSelected ? 1.15 : 1,
            }}
            
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
            }}
            whileHover={!isLocked ? { scale: 1.15 } : {}}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={!isLocked ? onClick : undefined}
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
            <div className={styles.tooltipStatus}>
              {getStatusLabel()}
            </div>
            <Tooltip.Arrow className={styles.tooltipArrow} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}