'use client';

import React from 'react';

interface MobileStatsProps {
    lessonCount: number;
    priceDisplay: string;
}

export function MobileStats({ lessonCount, priceDisplay }: MobileStatsProps) {
    return (
        <div className="lg:hidden grid grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Lessons</div>
                <div suppressHydrationWarning className="text-2xl font-bold text-white">{lessonCount}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Price</div>
                <div suppressHydrationWarning className="text-2xl font-bold text-white">{priceDisplay}</div>
            </div>
        </div>
    );
}
