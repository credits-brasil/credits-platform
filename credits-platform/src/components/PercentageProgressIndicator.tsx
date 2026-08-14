import { useEffect, useState, type ReactNode } from "react";

type PercentageProgressIndicatorComponentProps = {
  title: string;
  percentage: number;
  barColor: string;
  footer?: ReactNode;
  className?: string;
};

export function PercentageProgressIndicatorComponent({
  title,
  percentage,
  barColor,
  footer,
  className = "flex h-full flex-col gap-0.5 rounded-md border border-gray-100 p-1.5 xl:max-w-[320px]",
}: PercentageProgressIndicatorComponentProps) {
  const normalized = Math.min(Math.max(percentage, 0), 100);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();

    setAnimatedPercentage(0);

    let frameId = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedPercentage(normalized * easedProgress);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [normalized]);

  return (
    <div className={className}>
      <span className="text-[11px] text-gray-500 font-medium">{title}</span>

      <div className="space-y-0.5">
        <div className="h-2 w-full rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
          <div
            className="h-2 rounded-full"
            style={{
              width: `${animatedPercentage}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        <div className="flex justify-end">
          <span className="text-[10px] font-semibold text-gray-700">{animatedPercentage.toFixed(2)}%</span>
        </div>
      </div>

      {footer}
    </div>
  );
}