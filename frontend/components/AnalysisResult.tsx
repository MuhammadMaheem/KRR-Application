"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GitCompare, BookOpen } from "lucide-react";

interface Props {
  result: string;
  type: string;
  paperTitles?: string[];
  createdAt?: string;
}

export default function AnalysisResult({ result, type, paperTitles, createdAt }: Props) {
  const isComp = type === "comparative";
  const typeCls = isComp ? "krr-result__type--violet" : "krr-result__type--primary";
  const typeLabel = isComp ? "Comparative Analysis" : "Literature Review";

  return (
    <div className="krr-card krr-result">
      <div className="krr-result__header">
        <div className="krr-result__meta">
          <span className={`krr-result__type ${typeCls}`}>
            {isComp ? <GitCompare size={11} /> : <BookOpen size={11} />}
            {typeLabel}
          </span>
          {createdAt && (
            <span className="krr-result__date">
              {new Date(createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {paperTitles && paperTitles.length > 0 && (
          <div className="krr-result__papers">
            {paperTitles.map((t, i) => (
              <span key={i} className="krr-result__paper-chip">
                <span className="krr-result__paper-num">{i + 1}</span>
                <span className="krr-result__paper-title">
                  {t.length > 50 ? `${t.slice(0, 50)}…` : t}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="krr-result__body">
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
