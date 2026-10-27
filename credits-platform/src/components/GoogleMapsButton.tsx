import { MapPinned } from "lucide-react";

import { cn } from "@/lib/utils";
import { getGoogleMapsUrl } from "@/utils/getGoogleMapsUrl";

type GoogleMapsButtonProps = {
  address: string;
  className?: string;
  iconSize?: number;
};

/** Opens the address on Google Maps in a new window. */
export function GoogleMapsButton({
  address,
  className,
  iconSize = 14,
}: GoogleMapsButtonProps) {
  const title = "Abrir no Google Maps";

  return (
    <a
      href={getGoogleMapsUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      data-print-hidden
      title={title}
      aria-label={title}
      className={cn(
        "shrink-0 text-gray-400 transition-colors hover:cursor-pointer hover:text-[#243871]",
        className,
      )}
    >
      <MapPinned size={iconSize} aria-hidden="true" />
    </a>
  );
}
