import { ArrowUpRight, Clock3, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ru as t } from "@/i18n/ru";
import { AuthRequiredError, RateLimitError, ValidationError } from "@/services/api/errors";

export interface SubmitAreaProps {
  disabledReason: string;
  busy: boolean;
  running: boolean;
  error: Error | null;
  dateError: string | null;
  onSubmit(): void;
}

/** "Найти поля" with the reason it is disabled, and the create error. */
export function SubmitArea({ disabledReason, busy, running, error, dateError, onSubmit }: SubmitAreaProps) {
  return (
    <div className="submit-area">
      <Tooltip>
        <TooltipTrigger asChild>
          <div tabIndex={disabledReason ? 0 : -1}>
            <Button className="submit-button" data-testid="submit" disabled={!!disabledReason || busy} onClick={onSubmit}>
              {running || busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {t.submit}
              {!running && <ArrowUpRight className="ml-auto" />}
            </Button>
          </div>
        </TooltipTrigger>
        {disabledReason && <TooltipContent>{disabledReason}</TooltipContent>}
      </Tooltip>
      <div className="submit-hint">
        <Clock3 />
        {t.progress}
      </div>
      {error && !(error instanceof AuthRequiredError) && (
        <div className="error-text">
          {error instanceof RateLimitError ? t.rateLimit : error instanceof ValidationError ? (dateError ?? t.dateInvalid) : t.networkError}
          {!(error instanceof RateLimitError || error instanceof ValidationError) && (
            <Button variant="link" size="sm" onClick={onSubmit}>
              {t.retry}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
