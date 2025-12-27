"use client";

import { CheckCircle, Target, Package } from "lucide-react";

interface CourseBenefitsProps {
  benefits?: string[];
  targetAudience?: string;
  materialsIncluded?: string[];
  className?: string;
}

export default function CourseBenefits({
  benefits = [],
  targetAudience,
  materialsIncluded = [],
  className = "",
}: CourseBenefitsProps) {
  // Don't render if no data
  if (benefits.length === 0 && !targetAudience && materialsIncluded.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Benefits - What You'll Learn */}
      {benefits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#00BFA5]/10 flex items-center justify-center mr-3">
              <CheckCircle className="w-6 h-6 text-[#00BFA5]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              What You'll Learn
            </h3>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start">
                <svg
                  className="w-5 h-5 text-[#00BFA5] mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Target Audience */}
      {targetAudience && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#00BFA5]/10 flex items-center justify-center mr-3">
              <Target className="w-6 h-6 text-[#00BFA5]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Who This Course Is For
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {targetAudience}
          </p>
        </div>
      )}

      {/* Materials Included */}
      {materialsIncluded.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#00BFA5]/10 flex items-center justify-center mr-3">
              <Package className="w-6 h-6 text-[#00BFA5]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              What's Included
            </h3>
          </div>
          <ul className="space-y-3">
            {materialsIncluded.map((material, i) => (
              <li key={i} className="flex items-start">
                <svg
                  className="w-5 h-5 text-[#00BFA5] mr-3 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {material}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
