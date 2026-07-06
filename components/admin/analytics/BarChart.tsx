'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

interface BarData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarData[];
  title: string;
  description?: string;
  unit?: string;
}

export function BarChart({ data, title, description, unit = 'views' }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[180px] items-center justify-center text-gray-500 italic text-sm">
            No entries available.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {data.map((item, idx) => {
              const percentage = (item.value / maxVal) * 100;
              const rank = String(idx + 1).padStart(2, '0');

              return (
                <div key={item.label} className="group relative space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    {/* Rank + Name Label */}
                    <div className="flex items-center space-x-2 truncate pr-4">
                      <span className="text-[10px] text-[#C9A86A]/70 font-mono font-bold">
                        {rank}
                      </span>
                      <p className="text-white truncate font-medium group-hover:text-[#C9A86A] transition-colors duration-200">
                        {item.label}
                      </p>
                    </div>
                    {/* Count */}
                    <span className="text-gray-400 font-semibold font-mono whitespace-nowrap text-right shrink-0">
                      {item.value.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">{unit}</span>
                    </span>
                  </div>

                  {/* Custom horizontal progress bar with animation */}
                  <div className="w-full h-2 bg-[#111111] rounded-full overflow-hidden border border-gray-800/40">
                    <div
                      className="h-full bg-gradient-to-r from-[#8A7052] to-[#C9A86A] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
