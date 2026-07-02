'use client';

const SOCIAL_PLATFORMS = [
  { name: 'Instagram', label: 'IG', color: '#E4405F', icon: '📷' },
  { name: 'TikTok', label: 'TK', color: '#000000', icon: '♪' },
  { name: 'YouTube', label: 'YT', color: '#FF0000', icon: '▶' },
  { name: 'Twitter', label: 'X', color: '#000000', icon: '𝕏' },
  { name: 'LinkedIn', label: 'LI', color: '#0A66C2', icon: 'in' },
  { name: 'Facebook', label: 'FB', color: '#1877F2', icon: 'f' },
  { name: 'Discord', label: 'DC', color: '#5865F2', icon: '◉' },
  { name: 'Snapchat', label: 'SC', color: '#FFFC00', icon: '👻' },
  { name: 'WhatsApp', label: 'WA', color: '#25D366', icon: '💬' },
  { name: 'Pinterest', label: 'PI', color: '#E60023', icon: 'P' },
  { name: 'Threads', label: 'TH', color: '#000000', icon: '@' },
  { name: 'Reddit', label: 'RD', color: '#FF4500', icon: 'r/' },
];

interface Ring {
  platforms: typeof SOCIAL_PLATFORMS;
  radius: number;
  duration: number;
  delay: number;
}

export function FloatingLogosCss() {
  const rings: Ring[] = [
    {
      platforms: SOCIAL_PLATFORMS.slice(0, 4),
      radius: 130,
      duration: 22,
      delay: 0,
    },
    {
      platforms: SOCIAL_PLATFORMS.slice(4, 8),
      radius: 220,
      duration: 30,
      delay: 0.5,
    },
    {
      platforms: SOCIAL_PLATFORMS.slice(8, 12),
      radius: 320,
      duration: 42,
      delay: 1,
    },
  ];

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-bg-primary overflow-hidden">
      {/* Space vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(8,9,10,0) 40%, rgba(8,9,10,0.8) 100%)',
        }}
      />

      {/* Center NEXUS orb */}
      <div
        className="absolute w-28 h-28 rounded-full z-20"
        style={{
          background: 'radial-gradient(circle, #6C63FF 0%, #00D4FF 100%)',
          boxShadow: '0 0 80px #6C63FF, 0 0 160px rgba(0,212,255,0.4)',
        }}
      />
      <div className="absolute z-30 font-bold text-sm text-white tracking-widest">
        NEXUS
      </div>

      {/* Three orbit rings */}
      {rings.map((ring, ringIdx) => (
        <div key={ringIdx}>
          {ring.platforms.map((platform, logoIdx) => {
            const baseAngle = (logoIdx / ring.platforms.length) * 360;
            const keyframeName = `orbit-ring-${ringIdx}`;

            return (
              <div
                key={platform.name}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  width: '64px',
                  height: '64px',
                  marginLeft: '-32px',
                  marginTop: '-32px',
                  animation: `${keyframeName} ${ring.duration}s linear infinite`,
                  animationDelay: `${ring.delay}s`,
                  '--base-angle': `${baseAngle}deg`,
                } as React.CSSProperties & { '--base-angle': string }}
              >
                {/* Logo card */}
                <div
                  className="relative w-16 h-16 rounded-2xl glass flex items-center justify-center group hover:scale-110 transition cursor-pointer border"
                  style={{
                    backgroundColor: platform.color,
                    borderColor: platform.color,
                    opacity: 0.9,
                  }}
                >
                  {/* Label */}
                  <div className="text-white font-bold text-xs text-center">
                    {platform.label}
                  </div>

                  {/* Glow on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-70 transition"
                    style={{
                      backgroundColor: platform.color,
                      zIndex: -1,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Orbit CSS animations */}
      <style>{`
        @keyframes orbit-ring-0 {
          from {
            transform: translate(-50%, -50%) rotate(var(--base-angle)) translateX(130px) rotate(calc(-1 * var(--base-angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(var(--base-angle) + 360deg)) translateX(130px) rotate(calc(-1 * (var(--base-angle) + 360deg)));
          }
        }
        @keyframes orbit-ring-1 {
          from {
            transform: translate(-50%, -50%) rotate(var(--base-angle)) translateX(220px) rotate(calc(-1 * var(--base-angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(var(--base-angle) + 360deg)) translateX(220px) rotate(calc(-1 * (var(--base-angle) + 360deg)));
          }
        }
        @keyframes orbit-ring-2 {
          from {
            transform: translate(-50%, -50%) rotate(var(--base-angle)) translateX(320px) rotate(calc(-1 * var(--base-angle)));
          }
          to {
            transform: translate(-50%, -50%) rotate(calc(var(--base-angle) + 360deg)) translateX(320px) rotate(calc(-1 * (var(--base-angle) + 360deg)));
          }
        }
      `}</style>
    </div>
  );
}
