import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { TRPCProvider } from '@/components/providers/trpc-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXUS AI — AI Agents as Your Employees',
  description:
    'Enterprise-grade AI agents that work like real employees. Design your workforce in an immersive 3D studio, then automate any business process.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <TRPCProvider>
        <html lang="en" className="h-full antialiased scroll-smooth" suppressHydrationWarning>
          <head>
            {/* Brand fonts via CDN — keeps the build dependency-free */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap"
              rel="stylesheet"
            />
          </head>
          <body className="bg-bg-primary text-text-primary min-h-full flex flex-col">
            {children}
          </body>
        </html>
      </TRPCProvider>
    </ClerkProvider>
  );
}
