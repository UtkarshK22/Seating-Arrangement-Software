type Props = {
  selectedSeatIds: string[];
  onClear: () => void;
  onAssigned: () => void;
};

export function BulkSeatActions({
  selectedSeatIds,
  onClear,
  onAssigned,
}: Props) {
  if (selectedSeatIds.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#020617",
      color: "#fff",
      padding: 12,
      borderRadius: 8,
      display: "flex",
      gap: 8,
    }}>
      <span>{selectedSeatIds.length} seats selected</span>

      <button onClick={onAssigned}>Auto-Assign</button>
      <button onClick={onClear}>Clear</button>
    </div>
  );
}
