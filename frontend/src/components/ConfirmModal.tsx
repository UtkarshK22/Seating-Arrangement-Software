type Props = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "var(--panel-bg)",
          padding: 24,
          borderRadius: 8,
          width: 320,
        }}
      >
        <h4>{title}</h4>
        <p style={{ marginTop: 8 }}>{message}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 20,
          }}
        >
          <button onClick={onCancel}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              background: "#dc2626",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: 6,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}