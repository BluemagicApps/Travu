import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Prediction } from "@/lib/flights/prediction";
import { cn } from "@/lib/utils/cn";

export function PricePrediction({
  prediction,
  className,
}: {
  prediction: Prediction;
  className?: string;
}) {
  const { direction, recommendation, confidence } = prediction;
  const Icon = direction === "rise" ? TrendingUp : direction === "fall" ? TrendingDown : Minus;
  const tone =
    direction === "rise"
      ? "text-rose-500"
      : direction === "fall"
        ? "text-emerald-500"
        : "text-muted";

  return (
    <div className={cn("glass flex items-start gap-3 rounded-2xl p-4", className)}>
      <div className={cn("mt-0.5 shrink-0", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span>AI price prediction</span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
            {confidence}% confidence
          </span>
        </div>
        <p className="text-sm text-muted">{recommendation}</p>
      </div>
    </div>
  );
}
