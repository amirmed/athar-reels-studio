import React from 'react';

/**
 * DashboardSkeleton — shimmer loading state that mirrors the actual Dashboard layout.
 * Uses the `animate-shimmer` keyframe defined in tailwind.config.js.
 */

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`rounded-xl bg-gradient-to-r from-surface-800/60 via-surface-700/40 to-surface-800/60 bg-[length:200%_100%] animate-shimmer ${className}`}
  />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 space-y-6 animate-in">
    {/* Top stats row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-8 w-16" />
          <SkeletonBlock className="h-3 w-20" />
        </div>
      ))}
    </div>

    {/* Daily verse card */}
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
      </div>
      <SkeletonBlock className="h-16 w-full rounded-xl" />
    </div>

    {/* Quick actions row */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <SkeletonBlock className="w-10 h-10 rounded-xl" />
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-3 w-full" />
        </div>
      ))}
    </div>

    {/* Templates shelf */}
    <div className="space-y-3">
      <SkeletonBlock className="h-5 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <SkeletonBlock className="h-28 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
