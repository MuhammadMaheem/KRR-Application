import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Network,
  GitMerge,
  Lightbulb,
  Layers,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  GitCompare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { comparePapers } from "../api/papers";
import usePapersStore from "../store/papersStore";

const ComparisonView = () => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { papers, fetchPapers } = usePapersStore();

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get papers from store (or fetch if empty)
      let library = papers;
      if (library.length === 0) {
        await fetchPapers();
        library = usePapersStore.getState().papers;
      }

      if (library.length < 2) {
        setLoading(false);
        return;
      }

      const result = await comparePapers(library.map((p) => p.id));

      if (result.status === "success") {
        setComparison(result.data);
      } else {
        throw new Error("Comparison failed");
      }
    } catch (err) {
      console.error("Comparison API failed:", err);
      setError(err.message || "Failed to run comparison. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <GitCompare size={32} className="text-indigo-600" />
            Cross-Document Matrix
          </h1>
          <p className="text-slate-500 mt-1">Comparative synthesis of multiple research vectors.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchComparison} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={14} className="mr-2" /> Back
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-20 text-center space-y-4"
          >
            <div className="relative">
              <Loader2 size={60} className="text-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <GitCompare size={20} className="text-indigo-600" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Executing Neural Comparison</h3>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                Synthesizing multiple contexts into a unified matrix. This process may take up to 30
                seconds.
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center flex flex-col items-center gap-6 bg-red-50/50 rounded-3xl border border-red-100 max-w-xl mx-auto"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Comparison Engine Failure
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
            </div>
            <Button onClick={fetchComparison} className="bg-red-600 hover:bg-red-700">
              <RefreshCw size={16} className="mr-2" /> Re-Initialize Engine
            </Button>
          </motion.div>
        ) : !comparison ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-200"
          >
            <BookOpen size={64} className="text-slate-200 mb-6" />
            <h2 className="text-2xl font-bold text-slate-900">Insufficient Data Population</h2>
            <p className="text-slate-500 mt-2 max-w-sm">
              The matrix requires a minimum of 2 documents to compute comparative relationships.
            </p>
            <Button className="mt-8" onClick={() => navigate("/upload")}>
              Injest Documents
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Similarities */}
            <Card className="hover:border-emerald-200 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 bg-emerald-50/50">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Network size={20} />
                </div>
                <CardTitle className="text-emerald-900">Convergent Theories</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-600 text-sm leading-loose whitespace-pre-wrap">
                  {comparison.similarities}
                </p>
              </CardContent>
            </Card>

            {/* Differences */}
            <Card className="hover:border-rose-200 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 bg-rose-50/50">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <GitMerge size={20} />
                </div>
                <CardTitle className="text-rose-900">Divergent Methodologies</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-600 text-sm leading-loose whitespace-pre-wrap">
                  {comparison.differences}
                </p>
              </CardContent>
            </Card>

            {/* Complementary Aspects */}
            <Card className="hover:border-violet-200 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4 bg-violet-50/50">
                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg">
                  <Layers size={20} />
                </div>
                <CardTitle className="text-violet-900">Complementary Vectors</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-slate-600 text-sm leading-loose whitespace-pre-wrap">
                  {comparison.complementary_aspects}
                </p>
              </CardContent>
            </Card>

            {/* Synthesis */}
            <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
                <Lightbulb size={180} />
              </div>
              <CardHeader className="flex flex-row items-center gap-4 border-slate-800">
                <div className="p-2 bg-indigo-500 text-white rounded-lg">
                  <Lightbulb size={20} />
                </div>
                <CardTitle className="text-white">Synthetic Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative z-10">
                <p className="text-slate-300 text-sm leading-loose whitespace-pre-wrap">
                  {comparison.combined_insights}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComparisonView;
