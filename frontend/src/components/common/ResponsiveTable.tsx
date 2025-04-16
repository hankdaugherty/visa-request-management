import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
}

export default function ResponsiveTable({ children }: ResponsiveTableProps) {
  return (
    <div className="relative">
      <div className="absolute pointer-events-none inset-0 rounded-lg">
        {/* Right fade/shadow to indicate scrollability */}
        <div className="absolute right-0 w-8 h-full bg-gradient-to-l from-white to-transparent sm:hidden" />
      </div>
      <div className="overflow-x-auto rounded-lg shadow">
        <div className="inline-block min-w-full align-middle">
          {children}
        </div>
      </div>
    </div>
  );
} 