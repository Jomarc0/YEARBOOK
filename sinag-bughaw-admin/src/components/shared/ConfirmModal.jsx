import Btn from "./Btn";
import { T } from "../../tokens/design";

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 16,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 28,
        maxWidth: 420, width: "100%",
        boxShadow: "0 24px 48px rgba(0,0,0,.18)",
      }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 800, color: T.text }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 24px", color: T.muted, fontSize: "0.93rem", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} icon="🗑">Delete</Btn>
        </div>
      </div>
    </div>
  );
}
