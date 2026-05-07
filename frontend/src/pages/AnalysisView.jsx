import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Microscope, Target, AlertCircle, Quote, ArrowLeft, Download, Share2, Bookmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AnalysisView = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Summary');

  const paper = state?.paperData;

  if (!paper) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">No Analysis Data Detected</h2>
        <p className="text-slate-500 mt-2">The system requires an active data session to render this view.</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} className="mr-2" /> Return to Command Center
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'Summary', icon: <FileText size={18} /> },
    { id: 'Methodology', icon: <Microscope size={18} /> },
    { id: 'Results', icon: <Target size={18} /> },
    { id: 'Limitations', icon: <AlertCircle size={18} /> }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-slate-200">
        <div className="space-y-2">
          <Badge variant="primary" className="mb-2">AI-Synthesized Report</Badge>
          <h1 className="text-3xl font-black text-slate-900 leading-tight line-clamp-2 max-w-4xl">
            {paper.title}
          </h1>
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
            <span>{paper.authors}</span>
            <span className="text-slate-300">•</span>
            <span>Published {paper.year}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none">
            <Download size={14} className="mr-2" /> Export
          </Button>
          <Button variant="outline" size="sm" className="flex-1 md:flex-none text-red-500 border-red-100 hover:bg-red-50">
            <Bookmark size={14} className="mr-2" /> Archive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Intelligence Section */}
        <div className="lg:col-span-3 space-y-8">
          <Card className="min-h-[500px]">
            <CardHeader className="p-0">
              <div className="flex gap-1 p-2 bg-slate-50/50">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 py-2.5 px-5 text-sm font-bold transition-all rounded-lg",
                      activeTab === tab.id 
                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                    )}
                  >
                    {tab.icon} {tab.id}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed"
                >
                  {activeTab === 'Summary' && (
                    <div className="space-y-10">
                      <section>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                          <FileText size={20} className="text-indigo-500" /> Executive Abstract
                        </h3>
                        <p className="text-lg text-slate-700 leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                          {paper.abstract_summary}
                        </p>
                      </section>
                      <section>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                          <Target size={20} className="text-indigo-500" /> Core Contributions
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {paper.deep_analysis?.key_contributions?.split('\n').map((point, i) => (
                            point.trim() && (
                              <div key={i} className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                                <span className="text-indigo-400 font-bold">0{i+1}</span>
                                <p className="text-slate-600">{point.replace(/^[*-]\s*/, '')}</p>
                              </div>
                            )
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                  
                  {activeTab === 'Methodology' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold mb-4">Experimental Framework</h3>
                      <p className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-loose">
                        {paper.deep_analysis?.methodology}
                      </p>
                    </div>
                  )}

                  {activeTab === 'Results' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold mb-4">Empirical Findings</h3>
                      <p className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm leading-loose">
                        {paper.deep_analysis?.results}
                      </p>
                    </div>
                  )}

                  {activeTab === 'Limitations' && (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold mb-4">Critical Constraints</h3>
                      <p className="bg-red-50/30 p-6 rounded-2xl border border-red-100/50 leading-loose text-slate-700">
                        {paper.deep_analysis?.limitations}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* High-Level Intelligence Sidebar */}
        <div className="space-y-8">
          {/* AI Gap Analysis Card */}
          <Card className="bg-slate-900 text-white border-none overflow-hidden relative shadow-xl">
             <div className="absolute top-0 right-0 p-4 opacity-5">
              <Microscope size={120} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 font-bold text-indigo-400 mb-6 uppercase tracking-widest text-[10px]">
                <AlertCircle size={14} /> Intelligence Insight
              </div>
              <h3 className="font-bold text-lg mb-4">Detected Gaps</h3>
              <div className="space-y-4">
                {paper.gaps?.length > 0 ? (
                  paper.gaps.map((gap, i) => (
                    <div key={i} className="flex gap-3 text-sm text-slate-300">
                      <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      <span>{gap}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">No research gaps detected in current context.</p>
                )}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-8 bg-white/5 border-white/10 text-white hover:bg-white/10"
                onClick={() => navigate('/topic-input')}
              >
                Synthesize Review
              </Button>
            </CardContent>
          </Card>

          {/* Citation / Metadata */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 font-bold text-slate-800 mb-4 text-xs uppercase tracking-widest">
                <Quote size={14} className="text-indigo-500" /> Citation Tool
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  <strong>APA Style:</strong> <br/>
                  {paper.authors} ({paper.year}). {paper.title}. <br/>
                  <span className="italic">KRR Intelligence Library.</span>
                </p>
                <button className="mt-4 text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                  <Share2 size={10} /> Copy Citation String
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;