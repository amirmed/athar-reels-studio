import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Radio, Sparkles } from 'lucide-react';
import { Spatial8DStyle } from '../../types';

interface Spatial8DRadarProps {
  isEnabled: boolean;
  style?: Spatial8DStyle;
  speed?: number; // 0.05 - 0.35 Hz
  depth?: number; // 20 - 100%
  interactive?: boolean;
}

export const Spatial8DRadar: React.FC<Spatial8DRadarProps> = React.memo(
  ({ isEnabled, style = 'orbit360', speed = 0.12, depth = 85 }) => {
    const [angleDeg, setAngleDeg] = useState(0);
    const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const animRef = useRef<number | null>(null);

    useEffect(() => {
      if (!isEnabled) {
        setAngleDeg(0);
        setCoords({ x: 0, y: 0 });
        return;
      }

      const startTime = performance.now() / 1000;
      const depthFactor = depth / 100;

      const updateLoop = () => {
        const now = performance.now() / 1000;
        const elapsed = now - startTime;
        const phase = elapsed * speed * Math.PI * 2;

        let panX = 0;
        let panY = 0;

        switch (style) {
          case 'orbit360':
            panX = Math.cos(phase) * depthFactor;
            panY = Math.sin(phase) * depthFactor;
            break;
          case 'makkahDome':
            panX = Math.sin(phase) * depthFactor;
            panY = Math.cos(phase * 2) * 0.7 * depthFactor;
            break;
          case 'pendulum':
            panX = Math.sin(phase) * depthFactor;
            panY = Math.abs(Math.cos(phase)) * 0.4 * depthFactor;
            break;
          case 'floatingClouds':
            panX = Math.cos(phase) * Math.sin(phase * 0.3) * depthFactor;
            panY = Math.sin(phase) * depthFactor;
            break;
        }

        let deg = Math.atan2(panX, panY) * (180 / Math.PI);
        if (deg < 0) deg += 360;

        setAngleDeg(Math.round(deg));
        setCoords({ x: panX * 42, y: panY * 42 }); // Radius of ~42px

        animRef.current = requestAnimationFrame(updateLoop);
      };

      animRef.current = requestAnimationFrame(updateLoop);

      return () => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
      };
    }, [isEnabled, style, speed, depth]);

    const styleLabels: Record<Spatial8DStyle, string> = {
      orbit360: 'طواف الكعبة 360°',
      makkahDome: 'قبة الحرم العلوية',
      pendulum: 'بندول السكينة',
      floatingClouds: 'سحب النور العائمة',
    };

    return (
      <div className="flex flex-col items-center p-3 rounded-2xl bg-surface-950/70 border border-gold-500/20 shadow-inner relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gold-300">
            <Headphones size={13} className="text-gold-400 animate-pulse" />
            <span>رادار الصوت المكاني 8D 🛰️</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-mono font-bold">
            {isEnabled ? `${angleDeg}° • ${styleLabels[style]}` : 'معطل'}
          </span>
        </div>

        {/* 3D Radar Circle Viewport */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Orbital Track Rings */}
          <div className="absolute inset-0 rounded-full border border-gold-400/20 shadow-sm" />
          <div className="absolute inset-2.5 rounded-full border border-dashed border-white/10" />
          <div className="absolute inset-5 rounded-full border border-white/[0.06]" />

          {/* Cardinal Direction Indicators */}
          <span className="absolute top-0.5 text-[8px] text-white/40 font-bold">أمام</span>
          <span className="absolute bottom-0.5 text-[8px] text-white/40 font-bold">خلف</span>
          <span className="absolute right-1 text-[8px] text-white/40 font-bold">يمين</span>
          <span className="absolute left-1 text-[8px] text-white/40 font-bold">يسار</span>

          {/* Listener Head Center Icon */}
          <div className="relative z-10 w-9 h-9 rounded-full bg-surface-900 border border-gold-400/40 flex items-center justify-center shadow-lg shadow-gold-500/10">
            <Headphones size={16} className={isEnabled ? 'text-gold-400' : 'text-white/30'} />
            {isEnabled && (
              <span className="absolute -inset-1 rounded-full border border-gold-400/30 animate-ping pointer-events-none" />
            )}
          </div>

          {/* Orbiting Sound Particle (3D Sound Source) */}
          {isEnabled && (
            <motion.div
              className="absolute z-20 w-4 h-4 rounded-full bg-gradient-to-r from-gold-400 to-amber-300 shadow-md shadow-gold-400 flex items-center justify-center pointer-events-none"
              style={{
                transform: `translate(${coords.x}px, ${coords.y}px)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </motion.div>
          )}
        </div>

        {/* Bottom status */}
        <div className="mt-2 text-[11px] text-center text-white/50 leading-relaxed">
          {isEnabled ? (
            <span className="text-gold-300/80 flex items-center justify-center gap-1">
              <Sparkles size={11} className="text-gold-400" />
              الصوت يطوف حول الأذنين بزاوية 360° مع ارتداد صدى الحرم
            </span>
          ) : (
            <span>قم بتفعيل الصوت المكاني لتجربة انغماس 8D استثنائية</span>
          )}
        </div>
      </div>
    );
  }
);
