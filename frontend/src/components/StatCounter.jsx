import { useScrollReveal, useCountUp } from "../hooks/useScrollReveal";

export default function StatCounter({ target, suffix = "", label }) {
  const [ref, isVisible] = useScrollReveal(0.5);
  const value = useCountUp(target, isVisible);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-medium text-slate-900">
        {value}
        {suffix}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
