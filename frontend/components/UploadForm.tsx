"use client";
import { useState, useRef } from "react";
import { Upload, FileUp } from "lucide-react";
import { uploadPaper, Paper } from "@/lib/api";
import { useToast } from "./ToastProvider";

interface Props {
  onUploaded: (paper: Paper) => void;
}

export default function UploadForm({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast("Only PDF files are accepted", "error");
      return;
    }
    setFileName(file.name);
    setUploading(true);
    try {
      const res = await uploadPaper(file);
      onUploaded(res.data);
      toast(`"${file.name}" uploaded — AI summary generating…`, "success");
      setFileName(null);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast(msg || "Upload failed — please try again", "error");
      setFileName(null);
    } finally {
      setUploading(false);
    }
  };

  const zoneCls = [
    "krr-upload",
    dragging ? "krr-upload--drag" : "",
    uploading ? "krr-upload--loading" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={zoneCls}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && !uploading) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        aria-label="Upload PDF file"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {uploading ? (
        <div className="krr-upload__loading">
          <div className="krr-upload__loading-icon">
            <span className="krr-spinner krr-spinner--md" />
          </div>
          <div>
            <div className="krr-upload__loading-title">Uploading &amp; processing…</div>
            {fileName && <div className="krr-upload__loading-file">{fileName}</div>}
          </div>
        </div>
      ) : (
        <>
          <div className="krr-upload__icon">
            {dragging ? <FileUp size={21} strokeWidth={1.9} /> : <Upload size={21} strokeWidth={1.9} />}
          </div>
          <div>
            <div className={`krr-upload__title${dragging ? " krr-upload__title--drag" : ""}`}>
              {dragging ? "Release to upload" : (
                <>Drop a PDF here or <span>browse files</span></>
              )}
            </div>
            <div className="krr-upload__hint">PDF only · max ~50 MB</div>
          </div>
        </>
      )}
    </div>
  );
}
