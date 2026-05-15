import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import { PostHogProvider } from "@/components/PostHogProvider";
import { PostHogPageView } from "@/components/PostHogPageView";
import PageTransition from "@/components/PageTransition";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CelebrationProvider from "@/components/CelebrationProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import MobileMotionConfig from "@/components/MobileMotionConfig";
import StudyTimerGlobal from "@/components/StudyTimerGlobal";
import EasterEggs from "@/components/EasterEggs";
import { ComboProvider, ComboIndicator } from "@/components/ComboTracker";
import ComboToast from "@/components/ComboToast";
import SeasonalTheme from "@/components/SeasonalTheme";
import AccentProvider from "@/components/AccentProvider";
import ScrollProgress from "@/components/ScrollProgress";
import { NewBadgeProvider } from "@/components/NewBadge";
import { ProfileCustomProvider } from "@/components/ProfileCustomization";
import SettingsInit from "@/components/SettingsInit";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teach Me Like I'm 10",
  description:
    "Pick any topic and get layered explanations — from simple to expert. Powered by AI.",
  metadataBase: new URL("https://teachmelikeim10.xyz"),
  openGraph: {
    title: "Teach Me Like I'm 10",
    description:
      "Pick any topic. Start simple. Go as deep as you want. AI-powered layered learning.",
    siteName: "Teach Me Like I'm 10",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teach Me Like I'm 10",
    description:
      "Pick any topic. Start simple. Go as deep as you want. AI-powered layered learning.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-serif antialiased min-h-screen">
        <PostHogProvider>
          <PostHogPageView />
          <AuthProvider>
            <MobileMotionConfig>
              <CelebrationProvider>
                <AccentProvider>
                  <ProfileCustomProvider>
                    <NewBadgeProvider>
                      <SettingsInit />
                      <ComboProvider>
                        <SeasonalTheme>
                          <Navbar />
                          <ScrollProgress />
                          <PageTransition>{children}</PageTransition>
                          <Footer />
                          <ScrollToTop />
                          <BottomNav />
                          <KeyboardShortcuts />
                          <StudyTimerGlobal />
                          <ComboIndicator />
                          <ComboToast />
                          <EasterEggs />
                          <ServiceWorkerRegister />
                        </SeasonalTheme>
                      </ComboProvider>
                    </NewBadgeProvider>
                  </ProfileCustomProvider>
                </AccentProvider>
              </CelebrationProvider>
            </MobileMotionConfig>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
