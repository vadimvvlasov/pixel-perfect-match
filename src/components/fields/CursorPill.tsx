import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ru as t } from "@/i18n/ru";
import { formatLatLon, type LonLat } from "@/lib/geo";

/** The coordinates under the cursor; a click copies "lat, lon". */
export function CursorPill({ cursor, zoom }: { cursor: LonLat; zoom: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      className="cursor-pill glass"
      data-testid="cursor-pill"
      title={t.copy}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(formatLatLon(cursor));
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error(t.networkError);
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t.copied : `${formatLatLon(cursor)} · ${t.zoom} ${zoom.toFixed(1)}`}
    </Button>
  );
}
