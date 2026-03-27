import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono, Cormorant_Garamond, Syne, Plus_Jakarta_Sans, Instrument_Serif, DM_Mono } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SterlingVoice } from "@/components/voice/SterlingVoice";
import { AppScale } from "@/components/ui/AppScale";
import { metadataBase } from "@/lib/seo";

import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iOS safe-area support (notch / home bar)
};

export const metadata: Metadata = {
  metadataBase,
  title: "AI Bytes Learning - Peak Learning Velocity",
  description: "Transform from AI beginner to confident AI practitioner with zero-fluff, 15-minute high-velocity bytes. British English instruction with Sterling, our sophisticated AI coach.",
  keywords: ["AI education", "artificial intelligence courses", "AI learning platform", "AI training UK", "micro-learning"],
  authors: [{ name: "AI Bytes Learning" }],
  creator: "AI Bytes Learning",
  applicationName: "AI Bytes Learning",
  category: "Education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ai-bytes.org",
    siteName: "AI Bytes Learning",
    title: "AI Bytes Learning - Peak Learning Velocity",
    description: "Rapidly build AI capability with 15-minute high-velocity bytes.",
    images: ["/logos/ai-bytes-og.png"],
  },
  twitter: {
    card: "summary",
    title: "AI Bytes Learning - Peak Learning Velocity",
    description: "Rapidly build AI capability with 15-minute high-velocity bytes.",
  },
};

import { MobileNav } from "@/components/mobile-nav";
import { AmbientBackground } from "@/components/ui/ambient-background";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" suppressHydrationWarning={true} data-scroll-behavior="smooth">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable} ${syne.variable} ${plusJakartaSans.variable} ${instrumentSerif.variable} ${dmMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
          disableTransitionOnChange
        >
          <AnalyticsProvider>
            <AmbientBackground />
            <AppScale>
              <div className="page-shell min-w-0 w-full pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
                {children}
              </div>
            </AppScale>
            <MobileNav />
            <SterlingVoice />
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

