import { useScrollReveal, useCountUp } from "../hooks/useScrollReveal";

export default function StatCounter({ target, suffix = "", label }) {
  const [ref, isVisible] = useScrollReveal(0.5);
  const value = useCountUp(target, isVisible);

  return (
    <div ref={ref} className="text-center p-6 rounded-xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 transition-colors duration-200">
      <div className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
        {value}
        {suffix}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
    </div>
  );
}
