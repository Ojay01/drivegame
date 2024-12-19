
const RealisticCarSVG = ({ 
  x = 0, 
  y = 0, 
  width = 300, 
  height = 150, 
  crashed = false 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 150"
      width={width}
      height={height}
      x={x}
      y={y}
      style={{ 
        transform: crashed ? 'rotate(45deg)' : 'none',
        transformOrigin: 'center'
      }}
    >
      {/* Car Body Gradient */}
      <defs>
        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5722" stopOpacity="1"/>
          <stop offset="100%" stopColor="#E64A19" stopOpacity="1"/>
        </linearGradient>
        
        <linearGradient id="windowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#4682B4" stopOpacity="0.6"/>
        </linearGradient>

        <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="5" result="offsetblur"/>
          <feFlood floodColor="#000000" floodOpacity="0.4"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Shadow */}
      <path 
        d="M50 130 
           Q150 140, 250 130 
           A20 10 0 0 1 150 145 
           Q150 135, 50 130 Z" 
        fill="rgba(0,0,0,0.2)"
        filter="url(#shadowFilter)"
      />

      {/* Car Body */}
      <path 
        d="M50 80 
           Q150 50, 250 80 
           L250 100 
           Q150 110, 50 100 Z" 
        fill="url(#bodyGradient)"
        stroke="#D32F2F"
        strokeWidth="2"
      />

      {/* Front Bumper */}
      <path 
        d="M40 100 
           Q150 95, 260 100 
           L260 110 
           Q150 105, 40 110 Z" 
        fill="#424242"
      />

      {/* Windshield */}
      <path 
        d="M80 50 
           Q150 40, 220 50 
           L210 35 
           Q150 30, 90 35 Z" 
        fill="url(#windowGradient)"
        stroke="#0288D1"
        strokeWidth="1"
      />

      {/* Side Windows */}
      <path 
        d="M100 50 
           L200 50 
           L190 35 
           L110 35 Z" 
        fill="url(#windowGradient)"
        opacity="0.7"
      />

      {/* Wheels */}
      <g filter="url(#shadowFilter)">
        <circle cx="90" cy="120" r="20" fill="#212121" />
        <circle cx="210" cy="120" r="20" fill="#212121" />
        
        {/* Wheel Rims */}
        <circle cx="90" cy="120" r="15" fill="#BDBDBD" />
        <circle cx="210" cy="120" r="15" fill="#BDBDBD" />
        
        {/* Wheel Highlights */}
        <circle cx="90" cy="120" r="8" fill="rgba(255,255,255,0.3)" />
        <circle cx="210" cy="120" r="8" fill="rgba(255,255,255,0.3)" />
      </g>

      {/* Headlights */}
      <ellipse cx="70" cy="90" rx="8" ry="5" fill="#FFC107" opacity="0.8" />
      <ellipse cx="230" cy="90" rx="8" ry="5" fill="#FFC107" opacity="0.8" />

      {/* Reflections */}
      <path 
        d="M150 60 
           Q130 55, 110 60 
           Q150 65, 190 60 Z" 
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );
};

export default RealisticCarSVG;