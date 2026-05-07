import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ListChecks, ArrowRight, Info } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getLibrary } from '../api/papers';

const TopicInput = () => {
  const [topic, setTopic] = useState('');
  const [libraryIds, setLibraryIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getLibrary()
      .then((data) => setLibraryIds(data.map((p) => p.id)))
      .catch((err) => console.error('Could not fetch library', err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    localStorage.setItem('krr_review_topic', topic.trim());
    localStorage.setItem('krr_review_paper_ids', JSON.stringify(libraryIds));
    navigate('/literature-review', { state: { topic: topic, paperIds: libraryIds } });
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Target size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Synthesis Catalyst</h1>
        <p className="text-slate-500 mt-2">
          Define your research parameters to guide the AI generation engine.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Research Theme / Topic
                </label>
                <Badge variant="primary">Guidance Required</Badge>
              </div>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Analyzing the correlation between distributed ledger throughput and consensus latency in high-frequency trading..."
                className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 focus:bg-white outline-none transition-all min-h-45 resize-none text-slate-700 leading-relaxed font-medium placeholder:text-slate-300"
                required
              />
            </div>

            <div className="flex items-start gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                <ListChecks size={20} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-indigo-900 text-sm">Target Ingestion Set</p>
                <p className="text-sm text-indigo-700/80 leading-relaxed">
                  The generation engine will analyze{' '}
                  <span className="font-bold text-indigo-600">
                    {libraryIds.length} verified documents
                  </span>{' '}
                  from your current repository to synthesize the literature review.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-6 text-lg group"
                disabled={libraryIds.length === 0}
              >
                {libraryIds.length === 0
                  ? 'Insufficient Data'
                  : 'Initialize Comprehensive Synthesis'}
                <ArrowRight
                  size={20}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Button>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <Info size={12} /> Optimization: Llama-3-70B Contextual Awareness Active
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopicInput;
