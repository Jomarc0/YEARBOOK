export default function PremiumBadge({ size = "sm" }) {
  const s = size === "sm" ? "text-[0.6rem] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`font-bold rounded ${s} inline-flex items-center gap-1`}
      style={{ background: "linear-gradient(135deg, #fdb813, #e5a70e)", color: "#1d2b4b" }}
    >
      <i className="fas fa-crown" /> Premium
    </span>
  );
}
