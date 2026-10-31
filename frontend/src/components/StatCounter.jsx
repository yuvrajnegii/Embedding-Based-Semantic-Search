import { useScrollReveal, useCountUp } from "../hooks/useScrollReveal";

export default function StatCounter({ target, suffix = "", label }) {
  const [ref, isVisible] = useScrollReveal(0.5);
  const value = useCountUp(target, isVisible);

  return (
    <div ref={ref} className="text-center p-6 rounded-lg bg-[#0d0d0d] border border-[#242728] transition-colors duration-200">
      <div className="text-3xl font-semibold text-white">
        {value}
        {suffix}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
