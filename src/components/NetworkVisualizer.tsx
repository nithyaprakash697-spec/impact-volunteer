import React from 'react';

interface NetworkVisualizerProps {
  className?: string;
}

export const NetworkVisualizer: React.FC<NetworkVisualizerProps> = ({ className = '' }) => {
  return (
    <div className={`relative overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Background organic glow radial */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C6FF5E]/10 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Network Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lineGlow1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C6FF5E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10251D" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="lineGlow2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C6FF5E" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#071C16" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C6FF5E" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#C6FF5E" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C6FF5E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Organic curved connecting lines */}
        <path
          d="M 80 200 C 180 120, 240 280, 360 180 S 480 90, 520 160"
          stroke="url(#lineGlow1)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="opacity-75"
        />
        <path
          d="M 120 100 C 220 190, 290 80, 420 220 S 490 320, 540 250"
          stroke="url(#lineGlow2)"
          strokeWidth="1.5"
          className="opacity-60"
        />
        <path
          d="M 100 290 C 200 330, 300 240, 380 280 S 460 210, 510 200"
          stroke="rgba(198, 255, 94, 0.35)"
          strokeWidth="1.5"
        />
        <path
          d="M 220 110 C 260 210, 340 160, 420 220"
          stroke="rgba(198, 255, 94, 0.4)"
          strokeWidth="1.2"
        />

        {/* Glowing Node Clusters representing Students, AI Matching, and Opportunities */}
        {/* Node 1: Student Skills */}
        <g transform="translate(100, 180)">
          <circle cx="0" cy="0" r="24" fill="url(#nodeGlow)" />
          <circle cx="0" cy="0" r="14" fill="#10251D" stroke="#C6FF5E" strokeWidth="2" />
          <circle cx="0" cy="0" r="4" fill="#C6FF5E" />
          <text x="0" y="32" fill="#F5F4EC" fontSize="11" fontFamily="'DM Sans', sans-serif" fontWeight="600" textAnchor="middle">
            Student Profile
          </text>
        </g>

        {/* Node 2: Environmental Conservation */}
        <g transform="translate(240, 100)">
          <circle cx="0" cy="0" r="18" fill="url(#nodeGlow)" opacity="0.6" />
          <circle cx="0" cy="0" r="10" fill="#10251D" stroke="#C6FF5E" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#C6FF5E" />
          <text x="0" y="-18" fill="#A7B7A9" fontSize="10" fontFamily="'DM Sans', sans-serif" textAnchor="middle">
            Ecology & Nature
          </text>
        </g>

        {/* Center Node: AI Matching Engine */}
        <g transform="translate(320, 200)">
          <circle cx="0" cy="0" r="36" fill="url(#nodeGlow)" opacity="0.8" />
          <circle cx="0" cy="0" r="20" fill="#071C16" stroke="#C6FF5E" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="6" fill="#C6FF5E" />
          <text x="0" y="38" fill="#C6FF5E" fontSize="11" fontFamily="'DM Sans', sans-serif" fontWeight="700" textAnchor="middle">
            n8n Agent Match
          </text>
        </g>

        {/* Node 3: Youth Education */}
        <g transform="translate(220, 310)">
          <circle cx="0" cy="0" r="18" fill="url(#nodeGlow)" opacity="0.6" />
          <circle cx="0" cy="0" r="10" fill="#10251D" stroke="#C6FF5E" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3" fill="#C6FF5E" />
          <text x="0" y="24" fill="#A7B7A9" fontSize="10" fontFamily="'DM Sans', sans-serif" textAnchor="middle">
            Education Mentorship
          </text>
        </g>

        {/* Node 4: Community Development */}
        <g transform="translate(440, 130)">
          <circle cx="0" cy="0" r="22" fill="url(#nodeGlow)" opacity="0.7" />
          <circle cx="0" cy="0" r="12" fill="#10251D" stroke="#C6FF5E" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="3.5" fill="#C6FF5E" />
          <text x="0" y="-18" fill="#A7B7A9" fontSize="10" fontFamily="'DM Sans', sans-serif" textAnchor="middle">
            Civic Tech
          </text>
        </g>

        {/* Node 5: Verified Opportunities Output */}
        <g transform="translate(500, 240)">
          <circle cx="0" cy="0" r="28" fill="url(#nodeGlow)" opacity="0.8" />
          <circle cx="0" cy="0" r="16" fill="#10251D" stroke="#C6FF5E" strokeWidth="2" />
          <circle cx="0" cy="0" r="5" fill="#C6FF5E" />
          <text x="0" y="34" fill="#F5F4EC" fontSize="11" fontFamily="'DM Sans', sans-serif" fontWeight="600" textAnchor="middle">
            Verified Impact
          </text>
        </g>
      </svg>
    </div>
  );
};
