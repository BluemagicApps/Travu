import { cn } from "@/lib/utils/cn";
import { detectBrand, type CardBrand } from "@/lib/booking/card";

// Re-export so existing importers (BookingWizard, Payment) keep working.
export { detectBrand };
export type { CardBrand };

interface IconProps {
  className?: string;
}

function Visa({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="Visa">
      <rect width="48" height="30" rx="4" fill="#1A1F71" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fontStyle="italic"
        fill="#fff"
        fontFamily="Arial, sans-serif"
      >
        VISA
      </text>
    </svg>
  );
}

function Mastercard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="Mastercard">
      <rect width="48" height="30" rx="4" fill="#fff" stroke="#e2e8f0" />
      <circle cx="20" cy="15" r="7" fill="#EB001B" />
      <circle cx="28" cy="15" r="7" fill="#F79E1B" />
      <circle cx="24" cy="15" r="4" fill="#FF5F00" />
    </svg>
  );
}

function Amex({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="American Express">
      <rect width="48" height="30" rx="4" fill="#006FCF" />
      <text x="24" y="14" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#fff" fontFamily="Arial, sans-serif">
        AMERICAN
      </text>
      <text x="24" y="22" textAnchor="middle" fontSize="5.5" fontWeight="900" fill="#fff" fontFamily="Arial, sans-serif">
        EXPRESS
      </text>
    </svg>
  );
}

function Discover({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="Discover">
      <rect width="48" height="30" rx="4" fill="#fff" stroke="#e2e8f0" />
      <text x="22" y="18" textAnchor="middle" fontSize="6" fontWeight="900" fill="#231F20" fontFamily="Arial, sans-serif">
        DISCOVER
      </text>
      <circle cx="40" cy="20" r="3.5" fill="#FF6B00" />
    </svg>
  );
}

function Diners({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="Diners Club">
      <rect width="48" height="30" rx="4" fill="#fff" stroke="#e2e8f0" />
      <text x="24" y="14" textAnchor="middle" fontSize="5" fontWeight="800" fill="#0079BE" fontFamily="Arial, sans-serif">
        DINERS
      </text>
      <text x="24" y="22" textAnchor="middle" fontSize="5" fontWeight="800" fill="#0079BE" fontFamily="Arial, sans-serif">
        CLUB
      </text>
    </svg>
  );
}

function Jcb({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 30" className={className} aria-label="JCB">
      <rect width="48" height="30" rx="4" fill="#fff" stroke="#e2e8f0" />
      <text x="24" y="20" textAnchor="middle" fontSize="13" fontWeight="900" fill="#0E4C96" fontFamily="Arial, sans-serif">
        JCB
      </text>
    </svg>
  );
}

const ICONS: Record<CardBrand, (p: IconProps) => React.ReactElement> = {
  visa: Visa,
  mastercard: Mastercard,
  amex: Amex,
  discover: Discover,
  diners: Diners,
  jcb: Jcb,
};

export function BrandIcon({ brand, className }: { brand: CardBrand; className?: string }) {
  const Component = ICONS[brand];
  return <Component className={className} />;
}

const ALL: CardBrand[] = ["visa", "mastercard", "amex", "discover", "diners", "jcb"];

export function BrandIconStrip({ active }: { active?: CardBrand | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ALL.map((b) => (
        <BrandIcon
          key={b}
          brand={b}
          className={cn(
            "h-7 w-12 shrink-0 rounded-md transition",
            active && active !== b ? "opacity-30 saturate-50" : "",
          )}
        />
      ))}
    </div>
  );
}
