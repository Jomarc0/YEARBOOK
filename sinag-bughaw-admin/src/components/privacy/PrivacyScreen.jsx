import { usePrivacyProtection } from "../../hooks/usePrivacyProtection";

export default function PrivacyScreen() {
  const hidden = usePrivacyProtection();

  return (
    <div
      aria-hidden={!hidden}
      className={[
        "fixed inset-0 z-[2147483647] grid place-items-center overflow-hidden",
        "bg-[#071633] transition-opacity duration-150",
        hidden ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/images/NU-building.jpg')" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(253,184,19,0.22),transparent_28%),linear-gradient(135deg,rgba(8,24,56,0.98),rgba(29,43,75,0.94)_48%,rgba(4,12,31,0.98))]" />
      <div className="absolute left-0 top-0 h-1.5 w-full bg-[#fdb813]" />

      <div className="relative flex w-[min(90vw,440px)] flex-col items-center text-center text-white">
        <div className="mb-6 flex items-center gap-3">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-14 w-14 object-contain" />
          <div className="text-left">
            <p className="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#fdb813]">NU Admin</p>
            <p className="m-0 text-sm font-semibold text-white/75">National University Lipa</p>
          </div>
        </div>

        <div className="mb-5 grid h-20 w-20 place-items-center rounded-full border border-[#fdb813]/45 bg-white/10 shadow-[0_0_42px_rgba(253,184,19,0.22)]">
          <span className="relative block h-14 w-14 rounded-full bg-[#fdb813]">
            <span className="absolute left-1/2 top-3 h-5 w-6 -translate-x-1/2 rounded-t-full border-[4px] border-b-0 border-[#1d2b4b]" />
            <span className="absolute bottom-3 left-1/2 h-6 w-8 -translate-x-1/2 rounded bg-[#1d2b4b]" />
            <span className="absolute bottom-5 left-1/2 h-2 w-1 -translate-x-1/2 rounded-full bg-[#fdb813]" />
          </span>
        </div>

        <p className="mb-2 text-xl font-black tracking-normal text-white">
          Content Hidden for Privacy Protection
        </p>
        <p className="max-w-sm text-sm font-medium leading-6 text-white/68">
          Administrative and student records are protected while this screen is inactive.
        </p>
      </div>
    </div>
  );
}
