'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface DonutData {
  type: string;
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
  description?: string;
}

const COLOR_MAP: Record<string, string> = {
  page_view: '#C9A86A',            // Warm Gold
  contact_form_submit: '#10B981',  // Emerald Green
  popup_submit: '#3B82F6',         // Bright Blue
  service_view: '#A855F7',         // Rich Purple
  portfolio_view: '#F97316',       // Orange
  button_click: '#64748B',         // Cool Slate/Gray
};

export function DonutChart({ data, title, description }: DonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filteredData = data.filter((d) => d.value > 0);
  const total = filteredData.reduce((sum, d) => sum + d.value, 0);

  // SVG parameters
  const size = 160;
  const center = size / 2;
  const radius = 50;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  let accumulatedLength = 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-gray-500 italic text-sm">
            No events registered in this timeframe.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
            {/* SVG Donut Visualizer */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="overflow-visible select-none">
                {filteredData.map((d, idx) => {
                  const percentage = d.value / total;
                  const strokeLength = percentage * circumference;
                  const strokeOffset = circumference - accumulatedLength;
                  accumulatedLength += strokeLength;

                  const color = COLOR_MAP[d.type] || '#CCCCCC';
                  const isHovered = hoveredIndex === idx;
                  const isAnyHovered = hoveredIndex !== null;

                  return (
                    <circle
                      key={d.type}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={strokeOffset}
                      transform={`rotate(-90 ${center} ${center})`}
                      className="transition-all duration-350 cursor-pointer origin-center"
                      style={{
                        opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                        filter: isHovered ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}

                {/* Center Labels */}
                <g className="font-sans">
                  {hoveredIndex !== null && filteredData[hoveredIndex] ? (
                    <>
                      {/* Active hovered item info */}
                      <text
                        x={center}
                        y={center - 5}
                        textAnchor="middle"
                        className="fill-white font-serif text-base font-bold"
                      >
                        {filteredData[hoveredIndex].value.toLocaleString()}
                      </text>
                      <text
                        x={center}
                        y={center + 12}
                        textAnchor="middle"
                        className="fill-gray-400 text-[9px] tracking-wide font-medium truncate max-w-[80px]"
                      >
                        {filteredData[hoveredIndex].label}
                      </text>
                      <text
                        x={center}
                        y={center + 25}
                        textAnchor="middle"
                        className="fill-[#C9A86A] text-[9px] font-mono font-bold"
                      >
                        {((filteredData[hoveredIndex].value / total) * 100).toFixed(1)}%
                      </text>
                    </>
                  ) : (
                    <>
                      {/* Overall summary info */}
                      <text
                        x={center}
                        y={center + 4}
                        textAnchor="middle"
                        className="fill-white font-serif text-lg font-bold"
                      >
                        {total.toLocaleString()}
                      </text>
                      <text
                        x={center}
                        y={center + 18}
                        textAnchor="middle"
                        className="fill-gray-400 text-[8px] uppercase tracking-widest font-mono"
                      >
                        Events
                      </text>
                    </>
                  )}
                </g>
              </svg>
            </div>

            {/* Legend Grid */}
            <div className="flex-1 space-y-2.5 w-full">
              {filteredData.map((d, idx) => {
                const color = COLOR_MAP[d.type] || '#CCCCCC';
                const percentage = ((d.value / total) * 100).toFixed(1);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={d.type}
                    className={`flex items-center justify-between p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? 'bg-gray-800/40 border border-gray-700/30' : 'border border-transparent'
                    }`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-300 font-medium truncate">
                        {d.label}
                      </span>
                    </div>
                    <div className="text-right pl-4">
                      <span className="text-xs font-semibold text-white font-mono">
                        {d.value.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono ml-2">
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
