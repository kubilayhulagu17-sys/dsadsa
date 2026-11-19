import React, { useState } from 'react';
import { Download, Monitor, FolderArchive, X, CheckCircle2, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { sounds } from '../utils/sound';

export const PWAInstallButton: React.FC<{ variant?: 'button' | 'compact' }> = ({
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // When already running as installed standalone desktop/mobile app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    sounds.playDialogueBlip();
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={
          variant === 'compact'
            ? 'rpg-btn-iron px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer'
            : 'rpg-btn-iron px-4 py-3 rounded-md text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer'
        }
        title="Oyunu Bilgisayarına veya Telefonuna Kur / İndir"
      >
        <Download className="w-4 h-4 text-[#eab354]" />
        <span>{isInstallable ? "PC'ye Kur" : "PC'ye İndir"}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="rpg-iron-panel w-full max-w-lg rounded-md p-6 text-[#efe4cf] shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-medieval text-xl font-bold text-[#f3cf7a] tracking-wide">
                  Oyunu Bilgisayarına İndir &amp; Kur
                </h3>
                <p className="text-xs text-[#b8a78c] mt-1">
                  Masaüstü uygulaması olarak kurabilir veya kaynak dosyalarını indirip yerel olarak çalıştırabilirsin.
                </p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-[#a8967a] hover:text-[#f3cf7a] transition-colors cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rpg-divider mb-5" />

            <div className="space-y-4 text-sm leading-relaxed">
              {/* Method 1: Desktop App (PWA) */}
              <div className="rpg-parchment-inset p-4 rounded-sm">
                <div className="flex items-center gap-2 font-medieval font-bold text-[#f3cf7a] mb-2">
                  <Monitor className="w-4 h-4 text-[#eab354]" />
                  <span>1. Yöntem: Tek Tıkla Masaüstü Uygulaması (Önerilen)</span>
                </div>
                {isIOS ? (
                  <p className="text-xs text-[#d6c6ae] space-y-1">
                    Safari alt çubuğundaki <strong>Paylaş</strong> simgesine dokun ve{' '}
                    <strong>Ana Ekrana Ekle</strong> seçeneğini seç.
                  </p>
                ) : (
                  <ol className="text-xs text-[#d6c6ae] space-y-1.5 list-decimal list-inside">
                    <li>
                      Oyunu tarayıcıda tam sekme olarak aç (adres çubuğunda{' '}
                      <strong className="text-[#f3cf7a]">Yükle / Uygulamayı Yükle</strong> simgesi görünür).
                    </li>
                    <li>
                      Chrome veya Edge sağ üst menüsünden{' '}
                      <strong className="text-[#f3cf7a]">Kaydet ve Paylaş → Uygulamayı Yükle</strong> (veya{' '}
                      <em>Kısayol Oluştur</em>) seçeneğine tıkla.
                    </li>
                    <li>
                      Masaüstüne oyunun simgesi eklenir ve internet yokken bile tam ekran pencere olarak açılır.
                    </li>
                  </ol>
                )}
              </div>

              {/* Method 2: Source Download */}
              <div className="rpg-parchment-inset p-4 rounded-sm">
                <div className="flex items-center gap-2 font-medieval font-bold text-[#f3cf7a] mb-2">
                  <FolderArchive className="w-4 h-4 text-[#eab354]" />
                  <span>2. Yöntem: Kaynak Dosyaları ZIP Olarak İndir</span>
                </div>
                <ol className="text-xs text-[#d6c6ae] space-y-1.5 list-decimal list-inside">
                  <li>
                    Sağ üstteki <strong>İndir (Download / Export ZIP)</strong> menüsünden proje dosyalarını
                    bilgisayarına ZIP olarak indir ve klasöre çıkar.
                  </li>
                  <li>
                    Bilgisayarında <strong>Node.js</strong> kuruluysa klasörde terminali açıp sırayla{' '}
                    <code className="font-rpg-mono bg-black/50 px-1.5 py-0.5 rounded text-[#eab354]">
                      npm install
                    </code>{' '}
                    ve{' '}
                    <code className="font-rpg-mono bg-black/50 px-1.5 py-0.5 rounded text-[#eab354]">
                      npm run dev
                    </code>{' '}
                    komutlarını çalıştır.
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-[#4a3723]">
              <div className="flex items-center gap-1.5 text-xs text-[#a8967a]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Çevrimdışı önbellek desteği etkin</span>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rpg-btn-gold px-5 py-2 rounded-md text-xs font-medieval font-bold cursor-pointer"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 rpg-iron-panel px-3 py-1.5 rounded-md flex items-center gap-2 text-xs text-[#f3cf7a]">
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Çevrimdışı Mod — Yerel Önbellekten Çalışıyor</span>
    </div>
  );
};
