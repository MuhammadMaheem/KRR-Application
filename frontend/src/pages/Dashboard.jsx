import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Activity, Layers, ArrowRight, Database, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { motion } from "framer-motion";
import usePapersStore from "../store/papersStore";
import { deletePaper } from "../api/papers";

const Dashboard = () => {
  const { papers, loading, fetchPapers } = usePapersStore();
  const [stats, setStats] = useState({ total: 0, active: "Offline", analyses: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPapers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-1">Cross-referencing and literature analysis monitoring.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md">
            <Database size={16} className="mr-2" />
            System Logs
          </Button>
          <Button size="md" onClick={() => navigate("/upload")}>
            <UploadCloud size={16} className="mr-2" />
            Ingest New Data
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Managed Documents", value: papers.length, icon: FileText, color: "indigo" },
          { label: "Active Pipeline Sessions", value: "Offline", icon: Activity, color: "emerald" },
          { label: "Cross-Analyses Generated", value: "14", icon: Layers, color: "amber" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Library */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Knowledge Repository</h2>
            <Badge variant="primary">{papers.length} Objects</Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : papers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400">The repository is currently empty.</p>
                <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate("/upload")}>
                  Run Initial Ingestion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {papers.map((paper) => (
                <Card
                  key={paper.id}
                  className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                  onClick={() => navigate("/analysis", { state: { paperData: paper } })}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-red-500 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        PDF
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{paper.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 font-medium">{paper.authors}</span>
                          <span className="text-xs text-slate-300">•</span>
                          <Badge className="h-5 px-1.5">{paper.year}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Detail <ArrowRight size={14} className="ml-1" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this paper?")) {
                            deletePaper(paper.id).then(() => usePapersStore.getState().removePaper(paper.id));
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-slate-500">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Backend API</span>
                <Badge variant="success">Connected</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Vector Storage</span>
                <Badge variant="success">Optimized</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">NLP Engine</span>
                <span className="font-bold text-slate-700">Groq-Llama-3</span>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-[10px] text-slate-400 font-medium">Uptime: 99.98% // Last sync: 2m ago</p>
            </CardFooter>
          </Card>

          <Card className="bg-indigo-600 text-white border-none overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Layers size={80} />
            </div>
            <CardContent className="p-6 relative z-10">
              <h3 className="font-bold text-lg mb-2">Multi-Paper Synthesis</h3>
              <p className="text-indigo-100 text-sm mb-6">Compare multiple documents simultaneously to identify research gaps and overlapping methodologies.</p>
              <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/comparison")}>
                Launch Matrix View
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
