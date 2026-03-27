
"use client";

import { Zap, Flame, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MomentumMetaphor() {
    return (
        <Card className="overflow-hidden bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] -mr-16 -mt-16"></div>

            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <Info className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">The Momentum Engine</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                            <span className="text-orange-500 font-bold text-xs">01</span>
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-bold text-sm">The Initial Push</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Day 1 is the hardest. It takes the most energy to overcome intellectual inertia. Don't overthink—just start.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                            <span className="text-cyan-500 font-bold text-xs">02</span>
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-bold text-sm">The Flow State</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">By Day 3, the engine is humming. Consistency builds a mental "flow" where concepts click faster and friction vanishes.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-slate-900 dark:text-white font-bold text-sm">Peak Velocity</p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">Keep momentum for 7+ days to reach peak performance. At this speed, learning is no longer work—it's automatic.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-center italic">
                        "Stop starting, start finishing." — Sterling
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
