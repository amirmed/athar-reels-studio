import React from 'react';
import { motion } from 'framer-motion';
import { Move } from 'lucide-react';
import { TextSettings } from '../../../types';

interface PreviewWatermarkProps {
  watermark?: string;
  textSettings?: TextSettings;
  size?: 'normal' | 'fullscreen';
  onWatermarkDragEnd?: (x: number, y: number) => void;
}

export const PreviewWatermark: React.FC<PreviewWatermarkProps> = React.memo(
  ({
    watermark,
    textSettings,
    size = 'normal',
    onWatermarkDragEnd,
  }) => {
    if (!watermark || textSettings?.showWatermark === false) {
      return null;
    }

    const posClass =
      textSettings?.watermarkPosition === 'topLeft'
        ? 'top-3 start-4 justify-start text-start'
        : textSettings?.watermarkPosition === 'top'
          ? 'top-3 inset-x-0 justify-center text-center'
          : textSettings?.watermarkPosition === 'topRight'
            ? 'top-3 end-4 justify-end text-end'
            : textSettings?.watermarkPosition === 'bottomLeft'
              ? 'bottom-3 start-4 justify-start text-start'
              : textSettings?.watermarkPosition === 'bottomRight'
                ? 'bottom-3 end-4 justify-end text-end'
                : textSettings?.watermarkPosition === 'center'
                  ? 'top-1/2 inset-x-0 -translate-y-1/2 justify-center text-center'
                  : 'bottom-3 inset-x-0 justify-center text-center';

    return (
      <div className={`absolute z-30 flex pointer-events-none transition-all duration-300 ${posClass}`}>
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={{ left: -140, right: 140, top: -200, bottom: 200 }}
          whileHover={{ scale: 1.06 }}
          whileDrag={{ scale: 1.12, zIndex: 60 }}
          onDragEnd={(_e, info) => {
            if (onWatermarkDragEnd) {
              onWatermarkDragEnd(info.offset.x, info.offset.y);
            }
          }}
          className="group/watermark relative pointer-events-auto cursor-grab active:cursor-grabbing select-none gpu-layer"
          style={{
            opacity: textSettings?.watermarkOpacity ?? 0.65,
          }}
        >
          {/* Drag Handle Indicator */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/watermark:opacity-100 transition-opacity bg-black/85 px-2 py-0.5 rounded-full text-[8px] text-gold-300 border border-gold-500/30 flex items-center gap-1 shadow-lg pointer-events-none whitespace-nowrap z-40">
            <Move size={9} className="text-gold-400" />
            <span>اسحب باليد ✋</span>
          </div>

          <span
            className="font-sans font-medium tracking-wide px-2.5 py-1 rounded-lg transition-all group-hover/watermark:bg-black/40 group-hover/watermark:border group-hover/watermark:border-gold-400/40 inline-block"
            style={{
              fontSize: `${textSettings?.watermarkFontSize || (size === 'fullscreen' ? 13 : 11)}px`,
              color: textSettings?.watermarkColor || textSettings?.textColor || '#ffffff',
              textShadow: '0 1px 4px rgba(0,0,0,0.85)',
            }}
          >
            {watermark}
          </span>
        </motion.div>
      </div>
    );
  }
);
