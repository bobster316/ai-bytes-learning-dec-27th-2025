import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "AI Bytes Learning - Master AI in 60 Minutes",
    description: "Transform from AI beginner to confident AI practitioner",
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
