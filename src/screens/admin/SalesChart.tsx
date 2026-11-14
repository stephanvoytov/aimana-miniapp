import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import {
  formatDayKey,
  formatNumber,
  type SalesPoint,
} from "@/lib/admin";
import { formatPrice } from "@/lib/utils";

export type ChartMetric = "revenue" | "orders";

const HEIGHT = 280;
const PAD = { top: 18, right: 18, bottom: 30, left: 56 };

function niceMax(value: number, integer: boolean): number {
  if (value <= 0) return integer ? 4 : 1000;
  const power = 10 ** Math.floor(Math.log10(value));
  const normalized = value / power;
  const step =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 2.5
          ? 2.5
          : normalized <= 5
            ? 5
            : 10;
  const max = step * power;
  return integer ? Math.max(4, Math.ceil(max)) : max;
}

function valueLabel(value: number, metric: ChartMetric): string {
  return metric === "revenue" ? formatPrice(value) : `${formatNumber(value)} зак.`;
}

export function SalesChart({
  series,
  metric,
}: {
  series: SalesPoint[];
  metric: ChartMetric;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const resize = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(next);
    });
    resize.observe(node);
    setWidth(node.clientWidth || 760);
    return () => resize.disconnect();
  }, []);

  const chart = useMemo(() => {
    const innerWidth = Math.max(1, width - PAD.left - PAD.right);
    const innerHeight = Math.max(1, HEIGHT - PAD.top - PAD.bottom);
    const rawMax = series.reduce(
      (max, point) => Math.max(max, point[metric]),
      0,
    );
    const max = niceMax(rawMax, metric === "orders");
    const denominator = Math.max(1, series.length - 1);

    const points = series.map((point, index) => ({
      x: PAD.left + (index / denominator) * innerWidth,
      y: PAD.top + innerHeight - (point[metric] / max) * innerHeight,
      value: point[metric],
      date: point.date,
    }));

    const line = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
      )
      .join(" ");

    const baseline = PAD.top + innerHeight;
    const area =
      points.length > 0
        ? `${line} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`
        : "";

    return { innerWidth, innerHeight, max, points, line, area, baseline };
  }, [series, metric, width]);

  const { innerWidth, innerHeight, max, points, line, area, baseline } = chart;
  const orderAxis = metric === "orders";

  const labelCount = innerWidth < 420 ? 3 : 5;
  const labelIndices = Array.from(
    new Set(
      Array.from({ length: labelCount }, (_, index) =>
        Math.round((index * (points.length - 1)) / (labelCount - 1)),
      ),
    ),
  );

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const last = points.length > 0 ? points[points.length - 1] : null;
  const lastValue = last ? last.value : 0;
  const bubbleText =
    metric === "revenue" ? formatPrice(lastValue) : `${formatNumber(lastValue)} зак.`;
  const bubbleWidth = Math.max(56, bubbleText.length * 6.7 + 22);
  const bubbleX = last
    ? Math.min(
        Math.max(last.x, bubbleWidth / 2 + 4),
        Math.max(bubbleWidth / 2 + 4, width - bubbleWidth / 2 - 4),
      )
    : 0;
  const bubbleY = last
    ? last.y - 34 < 8
      ? last.y + 34
      : last.y - 34
    : 0;

  const showDots =
    points.filter((point) => point.value > 0).length <= 10;

  const handleMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.min(
      1,
      Math.max(0, (x - PAD.left) / Math.max(1, innerWidth)),
    );
    setHoverIndex(Math.round(ratio * (points.length - 1)));
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((tick) => {
          const y = PAD.top + innerHeight - (tick / 4) * innerHeight;
          const value = (max * tick) / 4;
          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="#eef0f3"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize={11}
                fill="#98a2b3"
              >
                {orderAxis
                  ? formatNumber(Math.round(value))
                  : formatNumber(value)}
              </text>
            </g>
          );
        })}

        {points.length > 0 && (
          <>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {showDots &&
          points.map((point) =>
            point.value > 0 ? (
              <circle
                key={point.date}
                cx={point.x}
                cy={point.y}
                r={2.6}
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth={2}
              />
            ) : null,
          )}

        {labelIndices.map((index) => {
          const point = points[index];
          if (!point) return null;
          const anchor =
            index === 0
              ? "start"
              : index === points.length - 1
                ? "end"
                : "middle";
          return (
            <text
              key={`label-${point.date}`}
              x={point.x}
              y={HEIGHT - 8}
              textAnchor={anchor}
              fontSize={11}
              fill="#98a2b3"
            >
              {formatDayKey(point.date)}
            </text>
          );
        })}

        {last && hoverIndex === null && (
          <g transform={`translate(${bubbleX}, ${bubbleY})`}>
            <rect
              x={-bubbleWidth / 2}
              y={-13}
              width={bubbleWidth}
              height={26}
              rx={13}
              fill="#ffffff"
              stroke="#e8e9ee"
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={600}
              fill="#15171c"
            >
              {bubbleText}
            </text>
          </g>
        )}

        {last && (
          <circle
            cx={last.x}
            cy={last.y}
            r={4}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={2.5}
          />
        )}

        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={baseline}
              stroke="#c7d2fe"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r={4}
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth={2.5}
            />
          </>
        )}
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 min-w-[128px] -translate-x-1/2 rounded-xl border border-adm-line bg-adm-card px-3 py-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
          style={{
            left: Math.min(Math.max(active.x, 72), Math.max(72, width - 72)),
            top:
              active.y - 76 < 0
                ? Math.min(active.y + 16, HEIGHT - 72)
                : active.y - 76,
          }}
        >
          <div className="text-[11px] text-adm-muted">
            {formatDayKey(active.date)}
          </div>
          <div className="mt-0.5 text-[13px] font-semibold text-adm-ink">
            {valueLabel(active.value, metric)}
          </div>
        </div>
      )}
    </div>
  );
}
