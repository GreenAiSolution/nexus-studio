import { ReactNode } from 'react';

// Full-bleed, chrome-free layout — the studio is a cinematic experience.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 overflow-hidden bg-bg-primary">{children}</div>;
}
