
"use client";

import { useEffect, useState } from "react";
import {
    Zap,
    Trophy,
    Flame,
    Target,
    ChevronRight,
    TrendingUp,
    BarChart2,
    Calendar,
    Lock,
    Star
} from "lucide-react";
import { motion } from "framer-motion";

export function AchievementDashboard({ userId }: { userId: string }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`/api/user/achievements?userId=${userId}`);
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error("Stats fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) return null;

    return (
        <div className="space-y-8 p-8 bg-black/20 rounded-[3rem] border border-white/5 backdrop-blur-xl">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border-b border-white/5 pb-8">
                <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-cyan-500/20">
                        {stats.profile?.current_level || 1}
                    </div>
                    <div>
                        <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-[0.3em] font-black mb-1">Explorer Class</div>
                        <h3 className="text-3xl font-black text-white tracking-tighter">Level {stats.profile?.current_level || 1}</h3>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Flame size={14} className="text-orange-500" />
                                <span className="font-bold text-slate-200">{stats.profile?.current_streak || 0} Day Momentum</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <Zap size={14} className="text-cyan-500" />
                                <span className="font-bold text-slate-200">{stats.profile?.total_xp || 0} XP Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-64">
                    <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">
                        <span>Progress to Level {(stats.profile?.current_level || 1) + 1}</span>
                        <span>{(stats.profile?.total_xp || 0) % 100}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.profile?.total_xp || 0) % 100}%` }}
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DetailCard
                    title="Lessons Mastery"
                    value={stats.profile?.total_lessons_completed || 0}
                    subtitle="Completed Modules"
                    icon={<Target className="text-emerald-500" />}
                />
                <DetailCard
                    title="Knowledge Retained"
                    value={stats.profile?.total_cards_mastered || 0}
                    subtitle="Flashcards Mastered"
                    icon={<BrainCircuit className="text-purple-500" />}
                />
                <DetailCard
                    title="Learning Velocity"
                    value={`${((stats.profile?.total_xp || 0) / 100).toFixed(1)}x`}
                    subtitle="Current Efficiency"
                    icon={<TrendingUp className="text-cyan-500" />}
                />
            </div>

            {/* Badges Section */}
            <div className="mt-8 pt-8 border-t border-white/5">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Achievement Badges</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.badges?.length > 0 ? stats.badges.map((b: any) => (
                        <div key={b.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                                <Trophy size={20} className="text-white" />
                            </div>
                            <div className="text-xs font-bold text-white mb-1">{b.badges?.name || 'Milestone'}</div>
                            <div className="text-[10px] text-slate-500 font-light">{b.badges?.description || 'Achievement unlocked'}</div>
                        </div>
                    )) : (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center opacity-30 grayscale">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                                    <Lock size={20} className="text-slate-500" />
                                </div>
                                <div className="h-2 w-16 bg-white/5 rounded-full mb-2"></div>
                                <div className="h-2 w-12 bg-white/5 rounded-full"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailCard({ title, value, subtitle, icon }: any) {
    return (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition-all group overflow-hidden relative">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                </div>
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</div>
                <div className="text-3xl font-black text-white mb-1">{value}</div>
                <div className="text-[10px] text-slate-600 font-mono uppercase">{subtitle}</div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 blur-[80px] -mr-16 -mt-16 opacity-5 pointer-events-none"></div>
        </div>
    );
}

const BrainCircuit = ({ className, size = 20 }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.13 6 6 0 0 0 11.577-3.05a3 3 0 1 0 5.997-.125 4 4 0 0 0 2.526-5.77 4 4 0 0 0-.52-8.13 6 6 0 0 0-11.577 3.05Z" />
        <path d="M9 13a4.5 4.5 0 0 0 3-4" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4" />
        <path d="M12 9v10" />
    </svg>
);
