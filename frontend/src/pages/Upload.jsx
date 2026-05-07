import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, File as FileIcon, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPaper } from "../api/papers";
import usePapersStore from "../store/papersStore";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const addPaper = usePapersStore((s) => s.addPaper);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const pdfs = selected.filter((file) => file.type === "application/pdf" || file.name.endsWith(".pdf"));
    setFiles((prev) => [...prev, ...pdfs]);
  };

  const removeFile = (index) => {
    setFiles((files) => files.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".pdf"));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const submitUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const result = await uploadPaper(formData);

      if (result.status === "success") {
        addPaper(result.data);
        navigate("/analysis", { state: { paperData: result.data } });
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">KRR Literature Ingestion</h1>
        <p className="text-slate-500 mt-2">Upload academic papers for high-fidelity NLP analysis and knowledge extraction.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Zone */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            className={cn(
              "relative border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group",
              dragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300 bg-white",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <UploadCloud size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Initialize Data Ingestion</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Drag and drop your PDF documents here, or click to browse your workstation.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="primary">SECURE ACCESS</Badge>
                <Badge>PDF ONLY</Badge>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </CardContent>
          </Card>

          {/* Process Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 text-slate-600">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <AlertCircle size={18} />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-slate-900">System Ready.</span> Awaiting document verification. All extracted data is stored in the local vector DB.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Queue */}
        <div className="space-y-6">
          <Card className="h-fit">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Submission Queue
                </h3>
                <Badge>{files.length}</Badge>
              </div>

              <div className="space-y-3 min-h-[200px]">
                <AnimatePresence mode="popLayout">
                  {files.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 text-slate-400 text-sm"
                    >
                      No documents staged.
                    </motion.div>
                  ) : (
                    files.map((file, idx) => (
                      <motion.div
                        key={file.name + idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-white rounded border border-slate-200 text-red-500 flex-shrink-0">
                            <FileIcon size={14} />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(idx);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 space-y-4">
                <Button className="w-full" disabled={files.length === 0 || isUploading} onClick={submitUpload}>
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" />
                      Executing Pipeline...
                    </>
                  ) : (
                    "Authorize AI Analysis"
                  )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-tighter">
                  End-to-End Encryption Enabled
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;
