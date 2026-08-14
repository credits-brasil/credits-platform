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
      <div className="flex w-full items-center gap-3">
        <span className="min-w-0 flex-1 text-[12px] font-medium text-gray-600">
          {title}
        </span>

        <div className="flex min-w-0 flex-[1.6] items-center gap-2">
          <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full"
              style={{
                width: `${animatedPercentage}%`,
                backgroundColor: barColor,
              }}
            />
          </div>

          <span className="w-[52px] text-right text-[10px] font-semibold text-gray-700">
            {animatedPercentage.toFixed(2)}%
          </span>
        </div>
      </div>

      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}