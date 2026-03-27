"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
// import { initPostHog } from "@/lib/analytics/posthog";
// import posthog from "posthog-js";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize PostHog
    // initPostHog();
  }, []);

  useEffect(() => {
    // Track page views only if PostHog is initialized
    // if (pathname && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    //   let url = window.origin + pathname;
    //   if (searchParams && searchParams.toString()) {
    //     url = url + `?${searchParams.toString()}`;
    //   }
    //   posthog.capture("$pageview", {
    //     $current_url: url,
    //   });
    // }
  }, [pathname]);

  return <>{children}</>;
}
