import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PreferenceProvider from "@/components/PreferenceProvider";
import SavedMoviesProvider from "@/components/SavedMoviesProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CineScope",
    template: "%s | CineScope",
  },
  description:
    "Next.js ve TMDB API ile geliştirilen film keşif uygulaması.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="bg-neutral-950 text-white">
        <SavedMoviesProvider>
          <PreferenceProvider>
            <Navbar />
            {children}
          </PreferenceProvider>
        </SavedMoviesProvider>
      </body>
    </html>
  );
}