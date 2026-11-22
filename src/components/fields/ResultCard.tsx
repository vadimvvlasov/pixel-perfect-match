import { ArrowDownToLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ru as t, formatDate } from "@/i18n/ru";
import type { ResultMeta } from "@/services/api/types";

export interface ResultCardProps {
  result: ResultMeta | undefined;
  pending: boolean;
  failed: boolean;
  downloadUrl(id: number): string;
  onRetry(): void;
}

export function ResultCard({ result, pending, failed, downloadUrl, onRetry }: ResultCardProps) {
  return (
    <section className="result-block" data-testid="result-panel">
      {pending ? (
        <>
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </>
      ) : failed ? (
        <>
          <p className="error-text">{t.networkError}</p>
          <Button variant="outline" onClick={onRetry}>
            {t.retry}
          </Button>
        </>
      ) : (
        result && (
          <>
            <div className="result-header">
              <Check size={15} />
              {t.resultsReady}
            </div>
            <div className="job-meta font-mono">{result.cell}</div>
            <div className="job-meta">
              {t.scene} {formatDate(result.scene_date)}
            </div>
            <div className="result-number">
              <span data-testid="result-fields-count">{result.n_fields}</span> <small>{t.fields}</small>
            </div>
            <div className="job-meta">
              {t.model} <span className="font-mono">{result.model_version}</span>
            </div>
            <Button asChild variant="outline" className="result-download">
              <a data-testid="download-geojson" href={downloadUrl(result.id)} download={`${result.cell}.geojson`}>
                <ArrowDownToLine />
                {t.download}
              </a>
            </Button>
          </>
        )
      )}
    </section>
  );
}
