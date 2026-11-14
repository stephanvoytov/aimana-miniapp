import { useMemo, type CSSProperties } from "react";

const COLORS = ["#007aff", "#34c759", "#f5a623", "#87b1ff", "#ffffff", "#d9c9a3"];

/**
 * Мини-конфетти из CSS-частиц: запуск при смене ключа (монтируется заново).
 * Частицы летят веером вверх и гаснут; при prefers-reduced-motion
 * анимация выключена и частицы просто не видны.
 */
export function Confetti({ count = 16 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
        const dist = 55 + Math.random() * 95;
        return {
          id: i,
          dx: Math.round(Math.cos(angle) * dist),
          dy: Math.round(Math.sin(angle) * dist) - 14,
          size: 5 + Math.round(Math.random() * 4),
          color: COLORS[i % COLORS.length],
          rz: Math.round((Math.random() - 0.5) * 420),
          dur: 600 + Math.round(Math.random() * 300),
          delay: Math.round(Math.random() * 90),
          round: i % 3 !== 0,
        };
      }),
    [count],
  );

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1 z-10 flex justify-center"
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="confetti-bit"
          style={
            {
              width: b.size,
              height: b.round ? b.size : Math.round(b.size * 0.55),
              backgroundColor: b.color,
              borderRadius: b.round ? "50%" : "2px",
              animationDuration: `${b.dur}ms`,
              animationDelay: `${b.delay}ms`,
              "--dx": `${b.dx}px`,
              "--dy": `${b.dy}px`,
              "--rz": `${b.rz}deg`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
