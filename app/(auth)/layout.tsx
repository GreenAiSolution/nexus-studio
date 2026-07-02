import { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary">
      <div className="w-full max-w-md mx-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">NEXUS</h1>
          <p className="text-text-secondary">AI Agents as Your Employees</p>
        </div>
        {children}
      </div>
    </div>
  );
}
