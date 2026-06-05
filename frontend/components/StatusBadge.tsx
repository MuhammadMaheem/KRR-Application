const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:    { label: "Pending",    cls: "status-badge--pend"  },
  processing: { label: "Processing", cls: "status-badge--proc"  },
  processed:  { label: "Ready",      cls: "status-badge--ready" },
  error:      { label: "Error",      cls: "status-badge--err"   },
};

export default function StatusBadge({ status }: { status: string }) {
  const c = STATUS_MAP[status] ?? { label: status, cls: "status-badge--pend" };
  return (
    <span className={`status-badge ${c.cls}`}>
      <span className="status-badge__dot" />
      {c.label}
    </span>
  );
}
