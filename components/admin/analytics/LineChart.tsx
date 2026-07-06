'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  metricLabel?: string;
}

export function LineChart({
  data,
  title,
  description,
  metricLabel = 'Visitors',
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const width = 600;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Handle empty or single point data safely
  const hasData = data && data.length > 0;
  const values = hasData ? data.map((d) => d.value) : [0];
  const maxVal = Math.max(...values, 5); // Fallback to 5 to avoid flat charts or division by zero

  // Generate plotting points
  const points = hasData
    ? data.map((d, index) => {
        const x = paddingX + (index / (data.length - 1 || 1)) * chartWidth;
        const y = paddingY + chartHeight - (d.value / maxVal) * chartHeight;
        return { x, y, label: d.label, value: d.value };
      })
    : [];

  // Generate SVG path for the line
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Generate SVG path for the area fill under the line
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  // Generate Y-axis grid labels (4 levels: 0, 33%, 66%, 100%)
  const yGridLevels = [0, 0.33, 0.66, 1];

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-gray-500 italic text-sm">
            No visitor trends to display.
          </div>
        ) : (
          <div ref={containerRef} className="relative w-full overflow-hidden">
            {/* Tooltip Overlay */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div
                className="absolute z-10 hidden sm:block pointer-events-none rounded-lg bg-[#252525] border border-[#C9A86A]/30 p-2.5 shadow-xl transition-all duration-150 font-sans"
                style={{
                  left: `${(points[hoveredIndex].x / width) * 100}%`,
                  top: `${(points[hoveredIndex].y / height) * 100 - 65}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold font-mono">
                  {points[hoveredIndex].label}
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {points[hoveredIndex].value.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#C9A86A]">{metricLabel}</span>
                </p>
              </div>
            )}

            {/* SVG Visualizer */}
            <svg
              className="w-full h-auto overflow-visible select-none"
              viewBox={`0 0 ${width} ${height}`}
              width="100%"
              height="100%"
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A86A" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#C9A86A" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {yGridLevels.map((lvl, idx) => {
                const yPos = paddingY + chartHeight - lvl * chartHeight;
                const gridVal = Math.round(lvl * maxVal);
                return (
                  <g key={idx} className="opacity-40">
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={width - paddingX}
                      y2={yPos}
                      stroke="#333333"
                      strokeWidth="1"
                      strokeDasharray="4,4"
                    />
                    <text
                      x={paddingX - 10}
                      y={yPos + 4}
                      textAnchor="end"
                      className="fill-gray-500 text-[10px] font-mono"
                    >
                      {gridVal}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill under Line */}
              {areaPath && (
                <path d={areaPath} fill="url(#lineAreaGrad)" className="transition-all duration-300" />
              )}

              {/* SVG Line Stroke */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#C9A86A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Hover Indicator Guidelines */}
              {hoveredIndex !== null && points[hoveredIndex] && (
                <g className="transition-all duration-150">
                  {/* Vertical dashed helper line */}
                  <line
                    x1={points[hoveredIndex].x}
                    y1={paddingY}
                    x2={points[hoveredIndex].x}
                    y2={height - paddingY}
                    stroke="#C9A86A"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    className="opacity-60"
                  />
                  {/* Pulsing glow ring on hovered point */}
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="8"
                    fill="#C9A86A"
                    className="opacity-25 animate-ping"
                  />
                  {/* Outer circle dot */}
                  <circle
                    cx={points[hoveredIndex].x}
                    cy={points[hoveredIndex].y}
                    r="6"
                    fill="#1A1A1A"
                    stroke="#C9A86A"
                    strokeWidth="2.5"
                  />
                </g>
              )}

              {/* Static Data Point Circles */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className="fill-[#1A1A1A] stroke-[#C9A86A] stroke-[1.5] hover:r-5 hover:stroke-[2] transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />
              ))}

              {/* X Axis Labels (First, Middle, Last to ensure zero overlap) */}
              {points.length > 0 && (
                <g className="fill-gray-500 text-[10px] font-mono opacity-80">
                  <text x={points[0].x} y={height - 8} textAnchor="start">
                    {points[0].label}
                  </text>
                  {points.length > 2 && (
                    <text
                      x={points[Math.floor(points.length / 2)].x}
                      y={height - 8}
                      textAnchor="middle"
                    >
                      {points[Math.floor(points.length / 2)].label}
                    </text>
                  )}
                  {points.length > 1 && (
                    <text x={points[points.length - 1].x} y={height - 8} textAnchor="end">
                      {points[points.length - 1].label}
                    </text>
                  )}
                </g>
              )}

              {/* Hover Interactive Slice Rects (provides easy hover detection target) */}
              {points.map((p, idx) => {
                const sliceWidth = chartWidth / (data.length - 1 || 1);
                const startX = p.x - sliceWidth / 2;
                return (
                  <rect
                    key={idx}
                    x={startX}
                    y={paddingY}
                    width={sliceWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Mobile-only Legend / Summary */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <div className="block sm:hidden mt-2 p-2 text-center rounded bg-[#222] border border-[#C9A86A]/20">
                <span className="text-[10px] text-gray-400 block font-mono">
                  {points[hoveredIndex].label}
                </span>
                <span className="text-sm font-bold text-white">
                  {points[hoveredIndex].value} {metricLabel}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
