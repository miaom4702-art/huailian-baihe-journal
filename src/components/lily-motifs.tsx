import { cn } from "@/lib/utils";

const PETALS = [
  { left: 6, top: 12, size: 10, delay: 0, duration: 19, opacity: 0.22 },
  { left: 18, top: 62, size: 7, delay: 4, duration: 23, opacity: 0.16 },
  { left: 34, top: 24, size: 9, delay: 8, duration: 21, opacity: 0.18 },
  { left: 52, top: 72, size: 6, delay: 2, duration: 26, opacity: 0.14 },
  { left: 68, top: 18, size: 11, delay: 6, duration: 20, opacity: 0.2 },
  { left: 82, top: 58, size: 8, delay: 10, duration: 24, opacity: 0.16 },
  { left: 92, top: 30, size: 6, delay: 3, duration: 22, opacity: 0.14 },
  { left: 44, top: 8, size: 7, delay: 12, duration: 27, opacity: 0.13 },
];

export function Petals({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {PETALS.slice(0, count).map((petal, index) => (
        <span
          key={index}
          className="lily-petal"
          style={{
            left: `${petal.left}%`,
            top: `${petal.top}%`,
            width: petal.size,
            height: petal.size * 1.35,
            opacity: petal.opacity,
            animationDelay: `-${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MoonPair({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 190"
      aria-hidden="true"
      className={cn("moon-breathe", className)}
    >
      <circle cx="74" cy="94" r="68" fill="#f3e4c6" opacity="0.08" />
      <circle cx="74" cy="94" r="52" fill="#f3e4c6" opacity="0.13" />
      <circle cx="74" cy="94" r="38" fill="#f3e4c6" opacity="0.45" />
      <circle cx="156" cy="66" r="25" fill="#b9d6df" opacity="0.5" />
      <circle
        cx="74"
        cy="94"
        r="61"
        fill="none"
        stroke="#c8a96a"
        strokeWidth="0.8"
        strokeDasharray="2 7"
        opacity="0.55"
      />
      <path
        d="M139 137 Q 194 115 230 151"
        fill="none"
        stroke="#c8a96a"
        strokeWidth="0.8"
        strokeDasharray="1 5"
        opacity="0.45"
      />
      <circle cx="204" cy="38" r="1.6" fill="#c8a96a" opacity="0.7" />
      <circle cx="224" cy="72" r="1.2" fill="#c8a96a" opacity="0.5" />
      <circle cx="118" cy="30" r="1.2" fill="#b9d6df" opacity="0.8" />
    </svg>
  );
}
