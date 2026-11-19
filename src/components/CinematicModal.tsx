import React, { useState, useEffect } from 'react';
import { Cinematic } from '../types/game';
import { SPEAKERS } from '../data/cinematics';
import { sounds } from '../utils/sound';
import { ChevronRight, FastForward, Sparkles, Shield } from 'lucide-react';

interface Props {
  cinematic: Cinematic;
  onComplete: () => void;
}

export const CinematicModal: React.FC<Props> = ({ cinematic, onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const slide = cinematic.slides[currentSlideIndex];
  const speaker = SPEAKERS[slide.speaker] || {
    id: slide.speaker,
    name: slide.speaker,
    role: 'Karakter',
    avatarBg: '#334155',
    accentColor: '#94a3b8',
  };

  useEffect(() => {
    sounds.playDialogueBlip();
  }, [currentSlideIndex]);

  const handleNext = () => {
    if (currentSlideIndex < cinematic.slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      sounds.playCoin();
      onComplete();
    }
  };

  const handleSkip = () => {
    sounds.playCoin();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 animate-fade-in select-none">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950 shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <span className="font-medieval text-sm font-semibold tracking-wider text-amber-400">
              {cinematic.title}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{cinematic.actTitle}</span>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <span>Geç</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scene Visual Area */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 bg-slate-900 overflow-hidden flex items-center justify-center">
          {slide.bgImage ? (
            <img
              src={slide.bgImage}
              alt={cinematic.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-1000 scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Shield className="w-16 h-16 text-amber-500/40 mb-3 animate-pulse" />
              <p className="font-medieval text-lg text-slate-300">{cinematic.title}</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">{cinematic.actTitle}</p>
            </div>
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/80 pointer-events-none" />

          {/* Slide Indicator Dots */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full border border-slate-700/50 backdrop-blur-sm">
            {cinematic.slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlideIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dialogue & Speaker Box */}
        <div className="relative p-6 bg-slate-950 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Speaker Avatar Badge */}
            <div
              className="flex items-center justify-center w-14 h-14 rounded-xl border-2 shadow-lg shrink-0"
              style={{
                backgroundColor: speaker.avatarBg,
                borderColor: speaker.accentColor,
              }}
            >
              <Sparkles className="w-7 h-7 text-white/90" />
            </div>

            {/* Speaker Info & Text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span
                  className="font-medieval text-base sm:text-lg font-bold tracking-wide"
                  style={{ color: speaker.accentColor }}
                >
                  {speaker.name}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  ({speaker.role})
                </span>
              </div>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans min-h-[3rem]">
                "{slide.text}"
              </p>
            </div>

            {/* Advance Button */}
            <button
              onClick={handleNext}
              className="mt-2 sm:mt-0 w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
            >
              <span>{currentSlideIndex === cinematic.slides.length - 1 ? 'Savaşa Başla' : 'İleri'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
