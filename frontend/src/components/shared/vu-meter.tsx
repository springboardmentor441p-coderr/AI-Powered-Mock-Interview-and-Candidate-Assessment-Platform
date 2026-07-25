export function VuMeter({ active = true }: { active?: boolean }) {
  return (
    <div className="vu-meter">
      <span className={active ? "animate-vu-1" : ""} style={{ height: "40%" }} />
      <span className={active ? "animate-vu-2" : ""} style={{ height: "100%" }} />
      <span className={active ? "animate-vu-3" : ""} style={{ height: "65%" }} />
      <span className={active ? "animate-vu-1" : ""} style={{ height: "80%" }} />
      <span className={active ? "animate-vu-2" : ""} style={{ height: "50%" }} />
    </div>
  );
}
