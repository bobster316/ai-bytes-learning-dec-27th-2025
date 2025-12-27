import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Bytes Learning - Master AI in 60 Minutes",
  description: "Transform from AI beginner to confident AI practitioner with our elegant, professionally designed courses. British English instruction with cutting-edge AI teaching assistants.",
  keywords: ["AI education", "artificial intelligence courses", "AI learning platform", "AI training UK"],
  authors: [{ name: "AI Bytes Learning" }],
  creator: "AI Bytes Learning",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ai-bytes.org",
    siteName: "AI Bytes Learning",
    title: "AI Bytes Learning - Master AI in 60 Minutes",
    description: "Transform from AI beginner to confident AI practitioner",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" suppressHydrationWarning={true}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable} antialiased`}
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
            {children}
          </AnalyticsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
