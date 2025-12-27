import posthog from "posthog-js";

export const initPostHog = () => {
  if (typeof window !== "undefined") {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    // Only initialize if PostHog key is available
    if (posthogKey) {
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") posthog.debug();
        },
      });
    } else {
      console.warn("PostHog analytics disabled: NEXT_PUBLIC_POSTHOG_KEY not found");
    }
  }
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== "undefined") {
    posthog.identify(userId, traits);
  }
};

export const resetUser = () => {
  if (typeof window !== "undefined") {
    posthog.reset();
  }
};

export default posthog;
