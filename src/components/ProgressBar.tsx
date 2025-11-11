"use client";

interface ProgressBarProps {
  percentage: number;
}

export default function ProgressBar({ percentage }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
      {/* eslint-disable-next-line react/forbid-dom-props */}
      <div
        className="bg-black h-4 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
