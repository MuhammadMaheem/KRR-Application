"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Paper, deletePaper } from "@/lib/api";
import { useToast } from "./ToastProvider";
import ConfirmDialog from "./ConfirmDialog";
import StatusBadge from "./StatusBadge";

interface Props {
  paper: Paper;
  onDeleted: () => void;
}

export default function PaperCard({ paper, onDeleted }: Props) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deletePaper(paper.id);
      toast(`"${paper.title.slice(0, 40)}…" deleted`, "info");
      onDeleted();
    } catch {
      toast("Failed to delete paper", "error");
    }
  };

  return (
    <>
    <ConfirmDialog
      open={confirmOpen}
      title="Delete paper?"
      message={`"${paper.title.length > 60 ? paper.title.slice(0, 60) + "…" : paper.title}" will be permanently deleted and cannot be recovered.`}
      confirmLabel="Delete"
      variant="danger"
      onConfirm={() => { setConfirmOpen(false); handleDelete(); }}
      onCancel={() => setConfirmOpen(false)}
    />
    <div className="krr-card krr-card--hover krr-paper-card">
      <div className="krr-paper-card__top">
        <Link href={`/papers/${paper.id}`} className="krr-paper-card__title">
          {paper.title}
        </Link>
        <StatusBadge status={paper.status} />
      </div>

      {paper.authors?.length > 0 && (
        <div className="krr-paper-card__authors">
          {paper.authors.join(" · ")}
        </div>
      )}

      {paper.abstract && (
        <div className="krr-paper-card__abstract">{paper.abstract}</div>
      )}

      <div className="krr-paper-card__footer">
        <div className="krr-paper-card__meta">
          {paper.page_count && (
            <span className="krr-paper-card__pill">{paper.page_count} pp</span>
          )}
          {paper.file_size && (
            <span className="krr-paper-card__pill">
              {(paper.file_size / 1024).toFixed(0)} KB
            </span>
          )}
        </div>
        <div className="krr-paper-card__actions">
          <Link href={`/papers/${paper.id}`} className="krr-paper-card__open">
            Open <ArrowUpRight size={12} />
          </Link>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="krr-paper-card__delete"
            aria-label="Delete paper"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
