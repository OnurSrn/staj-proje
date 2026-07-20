import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
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
          <Navbar />
          {children}
        </SavedMoviesProvider>
      </body>
    </html>
  );
}