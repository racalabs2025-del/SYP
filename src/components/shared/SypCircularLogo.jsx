import React from 'react';

export default function SypCircularLogo({
  size = 'md',
  animated = false,
  showText = false,
  className = '',
  progress = null, // optional 0-100
}) {
  const sizeMap = {
    xs: 32,
    sm: 48,
    md: 80,
    lg: 120,
    xl: 160,
  };

  const dimension = typeof size === 'number' ? size : sizeMap[size] || 80;
  const strokeWidth = dimension > 90 ? 4 : 3;
  const radius = (dimension - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={`syp-circular-logo-container ${animated ? 'is-animated' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: dimension,
          height: dimension,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="syp-circular-logo-svg"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="sypLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00498E" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <linearGradient id="sypGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00498E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
            </linearGradient>

            <filter id="sypLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00498E" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Background circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="rgba(0, 73, 142, 0.12)"
            strokeWidth={strokeWidth}
          />

          {/* Filling animated progress ring */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="url(#sypLogoGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={
              progress !== null
                ? circumference - (progress / 100) * circumference
                : animated
                ? circumference * 0.25
                : 0
            }
            strokeLinecap="round"
            className={animated ? 'syp-logo-ring-anim' : ''}
          />
        </svg>

        {/* Center Badge & Monogram */}
        <div
          style={{
            position: 'absolute',
            inset: strokeWidth * 2.5,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00498E 0%, #002b55 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0, 73, 142, 0.35)',
            color: '#ffffff',
            overflow: 'hidden',
          }}
          className={animated ? 'syp-logo-inner-pulse' : ''}
        >
          {/* Subtle decorative grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.15,
              backgroundImage:
                'radial-gradient(circle at center, #ffffff 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />

          {/* Compass / Location Icon & Text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              transform: 'scale(1)',
            }}
          >
            <svg
              width={dimension > 90 ? 28 : dimension > 50 ? 20 : 14}
              height={dimension > 90 ? 28 : dimension > 50 ? 20 : 14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: dimension > 70 ? '2px' : '0' }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>

            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
                fontSize: dimension > 90 ? '1.15rem' : dimension > 50 ? '0.78rem' : '0.55rem',
                letterSpacing: '0.06em',
                color: '#ffffff',
                lineHeight: 1,
                marginTop: '1px',
              }}
            >
              SYP
            </span>
          </div>
        </div>
      </div>

      {showText ? (
        <div style={{ textAlign: 'center' }}>
          <strong
            style={{
              display: 'block',
              fontSize: dimension > 90 ? '1.05rem' : '0.85rem',
              color: '#0f172a',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}
          >
            Saha Yönetim Paneli
          </strong>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            İstanbul Büyükşehir Belediyesi
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function SypCircularLoader({ text = 'Yükleniyor...', size = 'md' }) {
  return (
    <div
      className="syp-circular-loader"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
        gap: '1rem',
      }}
    >
      <SypCircularLogo size={size} animated={true} />
      {text ? (
        <span
          style={{
            fontSize: '0.84rem',
            fontWeight: 600,
            color: '#00498E',
            letterSpacing: '0.02em',
            animation: 'sypPulseText 1.5s ease-in-out infinite',
          }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}
