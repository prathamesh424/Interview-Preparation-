import React from 'react';

interface CircularProgressProps extends React.SVGProps<SVGSVGElement> {
  value: number; // Percentage value (0-100)
  strokeWidth?: number;
  size?: number;
  label?: string; // Optional text label inside the circle
  labelFontSize?: string;
  valueFontSize?: string;
  valueColor?: string;
  bgColor?: string; // Background circle color
  progressColor?: string; // Progress arc color
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  strokeWidth = 4,
  size = 100,
  label,
  labelFontSize = '0.8em',
  valueFontSize = '1.5em',
  valueColor = 'hsl(var(--primary))',
  bgColor = 'hsl(var(--muted))',
  progressColor = 'hsl(var(--primary))',
  ...props
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} {...props}>
      {/* Background Circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      {/* Progress Arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={progressColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round" // Makes the ends rounded
        transform={`rotate(-90 ${center} ${center})`} // Start from the top
        style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
      />
      {/* Text Value */}
      <text
        x="50%"
        y="50%"
        dy={label ? '-0.1em' : '0.35em'} // Adjust vertical position based on label presence
        textAnchor="middle"
        fontSize={valueFontSize}
        fontWeight="bold"
        fill={valueColor}
      >
        {`${Math.round(value)}%`}
      </text>
      {/* Optional Label */}
      {label && (
        <text
          x="50%"
          y="50%"
          dy="1.2em" // Position below the value
          textAnchor="middle"
          fontSize={labelFontSize}
          fill="hsl(var(--muted-foreground))"
        >
          {label}
        </text>
      )}
    </svg>
  );
};

export default CircularProgress;
