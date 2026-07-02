'use client';

/**
 * LuxBackground - CSS-only aurora backdrop
 * Works on any device (no WebGL, no JS computation)
 * 3 animated radial gradients (primary/secondary/gold) + dot grid + floating dust
 */

export function LuxBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bg-primary">
      {/* Aurora gradients - three drifting blobs */}
      <div className="absolute inset-0">
        {/* Primary purple blob - top left */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{
            background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
            left: '-200px',
            top: '-200px',
            animation: 'aurora-drift 20s ease-in-out infinite',
          }}
        />
        {/* Secondary cyan blob - top right */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
          style={{
            background: 'radial-gradient(circle, var(--secondary) 0%, transparent 70%)',
            right: '-100px',
            top: '100px',
            animation: 'aurora-drift 25s ease-in-out infinite reverse',
          }}
        />
        {/* Gold blob - bottom center */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)',
            left: '50%',
            bottom: '-300px',
            transform: 'translateX(-50%)',
            animation: 'aurora-pulse 15s ease-in-out infinite',
          }}
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, var(--primary) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Gold dust particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold animate-float opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(50px, -50px); }
        }

        @keyframes aurora-pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); opacity: 0.4; }
          50% { transform: translateY(-30px); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
