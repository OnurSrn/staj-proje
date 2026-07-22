import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import PreferenceProvider from "@/components/PreferenceProvider";
import SavedMoviesProvider from "@/components/SavedMoviesProvider";
import SettingsProvider from "@/components/SettingsProvider";
import { getServerLanguage } from "@/lib/serverLanguage";
import { SETTINGS_STORAGE_KEY } from "@/lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CineScope",
    template: "%s | CineScope",
  },
  description:
    "Next.js ve TMDB API ile geliştirilen film keşif uygulaması.",
};

// İlk paint öncesi tema flaşını önler (bkz. Next.js "Preventing flash
// before hydration" kılavuzu). Yalnızca sabit SETTINGS_STORAGE_KEY
// anahtarını okur, hiçbir değeri eval etmez, DOM'a yalnızca data-theme
// attribute'u yazar — dinamik HTML üretmez. localStorage
// erişilemiyorsa (ör. gizli sekme kısıtlaması) try/catch sessizce
// varsayılan (dark) görünümde bırakır.
const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  SETTINGS_STORAGE_KEY
)});var theme="system";if(raw){var parsed=JSON.parse(raw);if(parsed&&(parsed.theme==="dark"||parsed.theme==="light"||parsed.theme==="system")){theme=parsed.theme}}var resolved=theme==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):theme;document.documentElement.setAttribute("data-theme",resolved)}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = await getServerLanguage();

  return (
    <html lang={language} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground">
        <SavedMoviesProvider>
          <PreferenceProvider>
            <SettingsProvider initialLanguage={language}>
              <Navbar />
              {children}
            </SettingsProvider>
          </PreferenceProvider>
        </SavedMoviesProvider>
      </body>
    </html>
  );
}