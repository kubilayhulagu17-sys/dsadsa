import React from 'react';
import { ELEMENTS } from '../data/elements';
import { ElementType } from '../types/game';
import { sounds } from '../utils/sound';
import { Flame, Droplets, Wind, Check, X, Sparkles, Shield, Zap } from 'lucide-react';

interface Props {
  selectedElement?: ElementType;
  onSelectElement: (element: ElementType) => void;
  onClose?: () => void;
  forceSelection?: boolean;
}

export const ElementSelectModal: React.FC<Props> = ({
  selectedElement = 'fire',
  onSelectElement,
  onClose,
  forceSelection = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="font-medieval text-lg sm:text-xl font-bold text-slate-100">
              Kadim Elementini Seç
            </h2>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Şövalyenin Öz Gücü</span>
          </div>

          {!forceSelection && onClose && (
            <button
              onClick={() => {
                sounds.playDialogueBlip();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Intro Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-900/60 to-slate-950 border-b border-slate-800/80 text-xs text-slate-300">
          Eldoria Tapınağı'nda şövalyenin ruhu bir kadim element ile mühürlenir. Seçtiğin element 3D karakterinin aurasını, pasif yeteneklerini ve savaşta <strong className="text-amber-300">[F Tuşu]</strong> ile kullanabileceğin yıkıcı özel gücünü belirler.
        </div>

        {/* 3 Elements Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 overflow-y-auto max-h-[70vh]">
          {/* 1. Fire Element */}
          {(() => {
            const el = ELEMENTS.fire;
            const isSelected = selectedElement === 'fire';
            return (
              <div
                onClick={() => {
                  sounds.playSlash();
                  onSelectElement('fire');
                  if (onClose) onClose();
                }}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20 scale-102'
                    : 'bg-slate-900/60 border-slate-800 hover:border-rose-500/50 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                      <Flame className="w-7 h-7" />
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1 bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-500/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Seçildi</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-medieval text-lg font-black text-slate-100 mb-0.5">
                    {el.name}
                  </h3>
                  <span className="text-xs font-semibold text-rose-400 block mb-2.5">
                    {el.title}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {el.description}
                  </p>

                  <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-rose-900/30">
                      <span className="text-[11px] font-bold text-rose-400 block mb-0.5">
                        {el.passiveName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.passiveDesc}</p>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-rose-900/30">
                      <span className="text-[11px] font-bold text-amber-400 block mb-0.5">
                        {el.skillName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.skillDesc}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playCoin();
                    onSelectElement('fire');
                    if (onClose) onClose();
                  }}
                  className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/30'
                      : 'bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-200'
                  }`}
                >
                  {isSelected ? 'Aktif Element Kuşanıldı' : 'Ateşi Seç'}
                </button>
              </div>
            );
          })()}

          {/* 2. Water / Ice Element */}
          {(() => {
            const el = ELEMENTS.water;
            const isSelected = selectedElement === 'water';
            return (
              <div
                onClick={() => {
                  sounds.playSlash();
                  onSelectElement('water');
                  if (onClose) onClose();
                }}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/20 scale-102'
                    : 'bg-slate-900/60 border-slate-800 hover:border-sky-500/50 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400">
                      <Droplets className="w-7 h-7" />
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-sky-400 flex items-center gap-1 bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-500/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Seçildi</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-medieval text-lg font-black text-slate-100 mb-0.5">
                    {el.name}
                  </h3>
                  <span className="text-xs font-semibold text-sky-400 block mb-2.5">
                    {el.title}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {el.description}
                  </p>

                  <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-sky-900/30">
                      <span className="text-[11px] font-bold text-sky-400 block mb-0.5">
                        {el.passiveName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.passiveDesc}</p>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-sky-900/30">
                      <span className="text-[11px] font-bold text-cyan-300 block mb-0.5">
                        {el.skillName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.skillDesc}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playCoin();
                    onSelectElement('water');
                    if (onClose) onClose();
                  }}
                  className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                      : 'bg-slate-800 hover:bg-sky-600 hover:text-white text-slate-200'
                  }`}
                >
                  {isSelected ? 'Aktif Element Kuşanıldı' : 'Suyu Seç'}
                </button>
              </div>
            );
          })()}

          {/* 3. Air / Wind Element */}
          {(() => {
            const el = ELEMENTS.air;
            const isSelected = selectedElement === 'air';
            return (
              <div
                onClick={() => {
                  sounds.playSlash();
                  onSelectElement('air');
                  if (onClose) onClose();
                }}
                className={`rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/20 scale-102'
                    : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                      <Wind className="w-7 h-7" />
                    </div>
                    {isSelected && (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/40">
                        <Check className="w-3.5 h-3.5" />
                        <span>Seçildi</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-medieval text-lg font-black text-slate-100 mb-0.5">
                    {el.name}
                  </h3>
                  <span className="text-xs font-semibold text-amber-400 block mb-2.5">
                    {el.title}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {el.description}
                  </p>

                  <div className="space-y-2.5 pt-3 border-t border-slate-800/80">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-900/30">
                      <span className="text-[11px] font-bold text-amber-400 block mb-0.5">
                        {el.passiveName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.passiveDesc}</p>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-amber-900/30">
                      <span className="text-[11px] font-bold text-yellow-300 block mb-0.5">
                        {el.skillName}
                      </span>
                      <p className="text-[11px] text-slate-400">{el.skillDesc}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playCoin();
                    onSelectElement('air');
                    if (onClose) onClose();
                  }}
                  className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-200'
                  }`}
                >
                  {isSelected ? 'Aktif Element Kuşanıldı' : 'Havayı Seç'}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
