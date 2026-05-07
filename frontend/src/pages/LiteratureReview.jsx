import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Download,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FileText,
  Share2,
  Printer,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { getLibrary, generateReview as apiGenerateReview } from '../api/papers';

const LiteratureReview = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resolvedTopic, setResolvedTopic] = useState(state?.topic || '');
  const [resolvedPaperIds, setResolvedPaperIds] = useState(state?.paperIds || []);

  useEffect(() => {
    const hydrateAndGenerate = async () => {
      let topic = state?.topic || localStorage.getItem('krr_review_topic') || '';
      let paperIds = state?.paperIds || [];

      if (!paperIds.length) {
        try {
          const storedIds = localStorage.getItem('krr_review_paper_ids');
          if (storedIds) {
            const parsed = JSON.parse(storedIds);
            if (Array.isArray(parsed)) {
              paperIds = parsed;
            }
          }
        } catch {
          // Ignore malformed localStorage values
        }
      }

      if (!paperIds.length) {
        try {
          const library = await getLibrary();
          paperIds = (library || []).map((p) => p.id);
        } catch {
          // Keep empty and let validation below show a user-friendly error
        }
      }

      setResolvedTopic(topic);
      setResolvedPaperIds(paperIds);

      if (!topic || !topic.trim() || paperIds.length === 0) {
        setError(
          'Missing synthesis input. Please set a topic and ensure at least one paper is available.'
        );
        setLoading(false);
        return;
      }

      localStorage.setItem('krr_review_topic', topic.trim());
      localStorage.setItem('krr_review_paper_ids', JSON.stringify(paperIds));
      await doGenerateReview(topic, paperIds);
    };

    hydrateAndGenerate();
  }, []);

  const doGenerateReview = async (topic, paperIds) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGenerateReview(topic, paperIds);
      setReviewData(result.data?.review_content);
    } catch (err) {
      console.error('Literature review generation failed:', err);
      setError(err.message || 'The synthesis pipeline encountered an unrecoverable error.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const content = Object.values(reviewData || {}).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthesis_report_${Date.now()}.txt`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8"
          >
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText size={32} className="text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <Badge variant="primary" className="animate-pulse px-4 py-1">
                Synthesizing Context
              </Badge>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Generating Comparative Review
              </h2>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Aggregating data points from{' '}
                <span className="font-bold text-indigo-600">
                  {resolvedPaperIds.length} source documents
                </span>
                . Topic focus: <span className="italic">"{resolvedTopic}"</span>.
              </p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[40vh] text-center"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Synthesis Failure</h2>
            <p className="text-slate-500 mb-8 max-w-sm">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => doGenerateReview(resolvedTopic, resolvedPaperIds)}
                variant="primary"
              >
                <RefreshCw size={16} className="mr-2" /> Retry Synthesis
              </Button>
              <Button onClick={() => navigate('/topic-input')} variant="outline">
                <ArrowLeft size={16} className="mr-2" /> Adjust Goal
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Report Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-slate-200">
              <div className="space-y-3">
                <Badge variant="success">Final Synthesis Report</Badge>
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                  {reviewData?.title || 'System Synthesis: Literature Review'}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={14} /> Sources: {resolvedPaperIds.length}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5 italic">Ref: {resolvedTopic}</span>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex-1 md:flex-none"
                >
                  <Download size={14} className="mr-2" /> TXT
                </Button>
                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                  <Printer size={14} className="mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                  <Share2 size={14} />
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <Card className="border-none shadow-xl overflow-visible relative">
              <div className="absolute top-0 right-0 -mt-4 mr-4">
                <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-tighter text-slate-400">
                  Proprietary Analysis // Official Copy
                </div>
              </div>

              <CardContent className="p-12 md:p-16 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
                {/* Introduction */}
                <section className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Chapter 01
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Background & Inception</h2>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-lg font-serif">
                    {reviewData?.introduction}
                  </p>
                </section>

                {/* Body / Related Work */}
                <section className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Chapter 02
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Thematic Intersections</h2>
                  </div>
                  <div className="text-slate-700 leading-relaxed text-lg font-serif whitespace-pre-wrap pl-6 border-l-2 border-slate-100">
                    {reviewData?.related_work}
                  </div>
                </section>

                {/* Gaps */}
                <section className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                      Chapter 03
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Critical Void Analysis</h2>
                  </div>
                  <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <AlertCircle size={80} />
                    </div>
                    <h4 className="text-indigo-400 font-bold mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                      <AlertCircle size={14} /> Identified Research Gaps
                    </h4>
                    <p className="relative z-10 leading-relaxed italic text-lg opacity-90">
                      {reviewData?.research_gaps}
                    </p>
                  </div>
                </section>

                {/* Conclusion */}
                <section className="space-y-6 pt-10 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Chapter 04
                    </span>
                    <h2 className="text-2xl font-black text-slate-900">Synthesis Conclusion</h2>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-lg font-serif">
                    {reviewData?.conclusion}
                  </p>
                </section>

                <div className="pt-20 text-center">
                  <div className="inline-block px-10 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    End of Automatically Generated Report
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center pb-10">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/dashboard')}
                className="px-10"
              >
                <ArrowLeft size={16} className="mr-2" /> Command Center
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiteratureReview;
