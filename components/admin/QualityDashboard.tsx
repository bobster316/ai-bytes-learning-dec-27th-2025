
"use client";

import { useEffect, useState } from "react";
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    Search,
    BarChart3,
    FileText,
    ChevronRight,
    RefreshCw,
    SearchCode,
    CheckCheck,
    ShieldCheck,
    ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function QualityDashboard() {
    const [reports, setReports] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalLessons: 0,
        passedLessons: 0,
        failedLessons: 0,
        warningLessons: 0,
        averageScore: 0,
    });
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        fetchQualityReports();
    }, []);

    const fetchQualityReports = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/quality-reports");
            const data = await response.json();
            setReports(data.reports || []);
            setStats(data.stats || {
                totalLessons: 0,
                passedLessons: 0,
                failedLessons: 0,
                warningLessons: 0,
                averageScore: 0,
            });
        } catch (e) {
            console.error("Failed to fetch QA reports", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 pt-12">
            <div className="max-w-[1400px] mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <div className="mb-6">
                            <a href="/admin/courses" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#00FFB3] transition-colors text-sm font-medium">
                                <ArrowLeft size={16} />
                                Back to Course Admin
                            </a>
                        </div>
                        <div className="flex items-center gap-2 text-[#00FFB3] font-mono text-xs uppercase tracking-[0.3em] mb-3">
                            <ShieldCheck size={14} />
                            <span>System Integrity • Content QA</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                            Quality Audit Dashboard
                        </h1>
                        <p className="text-slate-500 mt-3 max-w-xl font-light">
                            Real-time monitoring of content quality, factual accuracy, and technical validity.
                        </p>
                    </div>
                    <button
                        onClick={fetchQualityReports}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 shadow-sm transition-all text-sm font-medium"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        Re-sync Audit
                    </button>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        title="Total Audited"
                        value={stats.totalLessons}
                        icon={<FileText className="text-slate-400" />}
                    />
                    <StatCard
                        title="Integrity Passed"
                        value={stats.passedLessons}
                        icon={<CheckCheck className="text-emerald-500" />}
                        subtitle={`${((stats.passedLessons / (stats.totalLessons || 1)) * 100).toFixed(0)}% success rate`}
                    />
                    <StatCard
                        title="Critical Failures"
                        value={stats.failedLessons}
                        icon={<XCircle className="text-rose-500" />}
                        color="rose"
                    />
                    <StatCard
                        title="Mean Quality Score"
                        value={`${(stats.averageScore * 100).toFixed(1)}%`}
                        icon={<BarChart3 className="text-[#00FFB3]" />}
                        color="cyan"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* List */}
                    <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <SearchCode size={18} className="text-[#00FFB3]" />
                                Audit Logs
                            </h3>
                            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                Showing {reports.length} Recent Logs
                            </div>
                        </div>

                        <div className="overflow-y-auto max-h-[600px] scrollbar-hide">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <th className="px-8 py-4">Lesson Module</th>
                                        <th className="px-8 py-4 text-center">Score</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reports.map((report) => (
                                        <motion.tr
                                            key={report.lessonId}
                                            layoutId={report.lessonId}
                                            onClick={() => setSelectedReport(report)}
                                            className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${selectedReport?.lessonId === report.lessonId ? 'bg-slate-50' : ''}`}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="text-sm font-bold text-slate-900">{report.lessonTitle}</div>
                                                <div className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-tighter">ID: {report.lessonId ? String(report.lessonId).substring(0, 8) : 'N/A'}</div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className={`text-sm font-mono font-bold ${report.overallScore >= 0.85 ? 'text-emerald-600' : report.overallScore >= 0.7 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                    {(report.overallScore * 100).toFixed(0)}%
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge score={report.overallScore} />
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#00FFB3]/10 group-hover:text-[#00FFB3] transition-all text-slate-400">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Details Sidebar */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            {selectedReport ? (
                                <motion.div
                                    key={selectedReport.lessonId}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm"
                                >
                                    <h4 className="text-xl font-bold text-slate-900 mb-6 font-display tracking-tight border-b border-slate-100 pb-4">Audit Details</h4>

                                    <div className="space-y-6">
                                        {(selectedReport.checks || []).map((check: any, idx: number) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{check?.checkType?.replace('_', ' ') || 'N/A'}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${check.status === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {(check?.status || 'UNKNOWN').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${check.score >= 0.8 ? 'bg-emerald-500' : check.score >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${(check.score || 0) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                                        <div className="mt-8">
                                            <div className="flex items-center gap-2 mb-4">
                                                <AlertTriangle size={14} className="text-amber-500" />
                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">Improvement Actions</h5>
                                            </div>
                                            <div className="space-y-3">
                                                {selectedReport.recommendations.map((rec: string, i: number) => (
                                                    <div key={i} className="flex gap-3 text-xs text-slate-500 font-light leading-relaxed p-2 rounded-lg hover:bg-slate-50">
                                                        <span className="text-rose-500 font-bold">•</span>
                                                        <span>{rec}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <div className="h-full min-h-[400px] flex items-center justify-center p-12 text-center bg-slate-50 border border-slate-200 rounded-[2rem] border-dashed">
                                    <div className="max-w-[200px]">
                                        <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-400 text-sm italic font-light">Select a module to view granular audit data</p>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle, color }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/5 transition-all group overflow-hidden relative shadow-sm">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>
                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
                {subtitle && <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase">{subtitle}</p>}
            </div>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -mr-16 -mt-16 opacity-30 pointer-events-none transition-opacity group-hover:opacity-50 ${color === 'rose' ? 'bg-rose-500' : color === 'cyan' ? 'bg-cyan-500' : 'bg-slate-400'}`}></div>
        </div>
    );
}

function StatusBadge({ score }: { score: number }) {
    if (score >= 0.85) {
        return (
            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Integrity Verified
            </span>
        );
    }
    if (score >= 0.75) {
        return (
            <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                Improvement Needed
            </span>
        );
    }
    return (
        <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            Audit Failed
        </span>
    );
}
