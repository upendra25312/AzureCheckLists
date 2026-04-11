import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import "./globals.css";

const SITE_URL = "https://jolly-sea-014792b10.6.azurestaticapps.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
