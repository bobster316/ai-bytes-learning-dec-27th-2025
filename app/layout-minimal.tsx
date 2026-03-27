import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { metadataBase } from "@/lib/seo";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase,
    title: "AI Bytes Learning - Master AI with Micro Courses",
    description: "Transform from AI beginner to confident AI practitioner",
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en-GB">
            <body className={`${inter.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}

