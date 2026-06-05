"use client";
import { Check, FileText } from "lucide-react";
import { Paper } from "@/lib/api";

interface Props {
  papers: Paper[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function PaperSelector({ papers, selected, onChange }: Props) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (papers.length === 0) {
    return (
      <div className="krr-empty krr-selector__empty">
        <div className="krr-empty__icon">
          <FileText size={20} />
        </div>
        <div className="krr-empty__title">No processed papers</div>
      </div>
    );
  }

  return (
    <div className="krr-selector">
      {papers.map((p) => {
        const on = selected.includes(p.id);
        return (
          <label
            key={p.id}
            className={`krr-selector__item${on ? " krr-selector__item--selected" : ""}`}
          >
            <div className={`krr-selector__check${on ? " krr-selector__check--on" : ""}`}>
              {on && <Check size={10} strokeWidth={3} color="var(--primary-fg)" />}
            </div>
            <input
              type="checkbox"
              checked={on}
              onChange={() => toggle(p.id)}
              aria-label={`Select: ${p.title}`}
              className="sr-only"
            />
            <div className="krr-selector__text">
              <div className="krr-selector__title">{p.title}</div>
              {p.authors?.length > 0 && (
                <div className="krr-selector__authors">{p.authors.join(", ")}</div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}
