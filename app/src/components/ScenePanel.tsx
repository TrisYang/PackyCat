import { useState, useEffect } from 'react';
import type { CatAction, ChecklistItem, PackedSlot } from '@/types';
import { getItemImage } from '@/lib/checklist';

interface ScenePanelProps {
  isMobile?: boolean;
  days: number | '';
  destination: string;
  packedSlots: Record<string, PackedSlot>;
  allItems: ChecklistItem[];
  catState: CatAction;
  suitcaseClosed: boolean;
  hasCategories: boolean;
  packedCount: number;
  totalCount: number;
  allPacked: boolean;
}

export default function ScenePanel({
  isMobile = false,
  days,
  destination,
  packedSlots,
  allItems,
  catState,
  suitcaseClosed,
  hasCategories,
  packedCount,
  totalCount,
  allPacked,
}: ScenePanelProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  const sz = isMobile
    ? (days <= 5 ? { w: 300, h: 200 } : { w: 361, h: 240 })
    : (days <= 5 ? { w: 580, h: 387 } : { w: 665, h: 444 });

  const catW = isMobile ? 55 : 140;
  const br = isMobile ? 8 : 16;
  const isSmallSize = days <= 5;
  const suitcaseImg = isSmallSize ? './v2_suitcase_medium_black.png' : './v2_suitcase_large_black.png';

  // Suitcase inner lining area (pixel-analyzed; keeps items within outer frame)
  const SUITCASE_INSET = {
    small: { left: 11.1, right:  8.9, top: 14.8, bottom: 15.0 },
    large: { left:  9.7, right:  8.3, top: 16.2, bottom: 16.3 },
  };
  const inset = isSmallSize ? SUITCASE_INSET.small : SUITCASE_INSET.large;
  const innerLeft = inset.left;
  const innerRight = 100 - inset.right;
  const innerTop = inset.top;
  const innerBottom = 100 - inset.bottom;
  const innerWidth = innerRight - innerLeft;
  const innerHeight = innerBottom - innerTop;

  // Cat fixed position inside inner lining (top-left corner with small offset)
  const catLeft = innerLeft + 3;
  const catTop = innerTop + 3;

  // Cat animation class
  const catAnimClass =
    catState === 'jumping' ? 'cat-jumping' :
    catState === 'idle' ? 'cat-idle' :
    catState === 'reaching' ? 'cat-arm-reaching' :
    catState === 'holding' ? 'cat-holding-item' :
    catState === 'placing' ? 'cat-arm-reaching' :
    catState === 'removing' ? 'cat-removing-item' :
    catState === 'pulling' ? 'cat-pulling' : '';

  return (
    <div className={`scene-panel relative overflow-hidden ${isMobile ? 'flex md:hidden aspect-[16/9] w-full flex-shrink-0' : 'hidden md:flex flex-1'}`}>

      {/* ══════ LAYER 1: Background (always fixed) ══════ */}
      <div className="absolute inset-0" style={{ backgroundImage: 'url(./room-floor-2.png)', backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,251,242,0.3) 0%, rgba(255,251,242,0.05) 50%, rgba(255,251,242,0.4) 100%)' }} />

      {/* Particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${15 + i * 14}%`, bottom: `${20 + (i % 3) * 20}%`,
          animationDelay: `${i * 0.5}s`, width: `${4 + (i % 3) * 2}px`, height: `${4 + (i % 3) * 2}px`,
          background: i % 2 === 0 ? 'var(--peach)' : 'var(--sky)', opacity: 0.35,
        }} />
      ))}

      {/* ══════ LAYER 2+3: Flat Suitcase Image + Cat Inside ══════ */}
      <div className="absolute z-10" style={{
        left: '50%', bottom: isMobile ? 20 : 40,
        transform: 'translateX(-50%)',
        width: sz.w, height: sz.h,
      }}>
        {/* Suitcase flat image */}
        <img src={suitcaseImg} alt="行李箱" className="w-full h-full object-contain" draggable={false} style={{ position: 'relative', zIndex: 10 }} />

        {/* Items placed inside suitcase inner lining — stacked by order */}
        {Object.entries(packedSlots).map(([itemId, slot]) => {
          const item = allItems.find(i => i.id === itemId);
          if (!item) return null;
          const x = innerLeft + (slot.x / 100) * innerWidth;
          const y = innerTop + (slot.y / 100) * innerHeight;
          const itemSize = isMobile ? 64 : 98;
          const isNew = now - slot.addedAt < 500;
          const imgPath = slot.image || getItemImage(item.text);
          const extraScale = (imgPath === './item_bag_documents.png' || imgPath === './item_laptop.png') ? 1.1 : 1;
          return (
            <div key={itemId} className="packed-item-visual" style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: itemSize, height: itemSize,
              zIndex: 20 + slot.order * 5,
              transform: `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.scale * extraScale})`,
            }}>
              <div className="w-full h-full" style={isNew ? { animation: 'item-pop-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' } : undefined}>
                <img src={imgPath} alt={item.text} className="w-full h-full object-contain" draggable={false} />
              </div>
            </div>
          );
        })}

        {/* === Cat lying inside suitcase inner area — on top of items === */}
        <div className={`absolute z-[100] ${catAnimClass}`} style={{
          left: `${catLeft}%`,
          top: `${catTop}%`,
          width: catW,
        }}>
          <img src="./cat-sleeping.png" alt="小猫管家" style={{ width: '100%', height: 'auto' }} className="object-contain drop-shadow-lg" draggable={false} />
        </div>

        {/* Closed lid overlay (right half only) */}
        {suitcaseClosed && (
          <div className="absolute flex items-center justify-center" style={{ zIndex: 40, left: '50%', top: 0, right: 0, bottom: 0, animation: 'zipper-close 0.8s ease-out forwards' }}>
            <div className="w-full h-full" style={{ background: 'linear-gradient(180deg, #3A3A3A 0%, #2A2A2A 100%)', opacity: 0.85, borderRadius: `0 ${Math.max(2, br - 4)}px ${Math.max(2, br - 4)}px 0` }}>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2 rounded-full" style={{ background: '#555' }} />
            </div>
          </div>
        )}
      </div>

      {/* ══════ UI Overlay ══════ */}
      {hasCategories && (
        <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 z-50 flex justify-between items-start">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-3 md:px-4 py-1.5 md:py-2 shadow-sm">
            <p className="text-[10px] md:text-xs font-semibold" style={{ color: 'var(--gray-mid)', fontFamily: 'var(--font-body)' }}>{destination}</p>
            <p className="text-sm md:text-xl font-bold" style={{ color: 'var(--gray-dark)', fontFamily: 'var(--font-display)' }}>{packedCount}/{totalCount}</p>
          </div>
          {allPacked && (
            <div className="flex gap-1">
              <span className="sparkle-1 text-sm md:text-lg" style={{ color: 'var(--peach)' }}>✦</span>
              <span className="sparkle-2 text-base md:text-xl" style={{ color: 'var(--rose)' }}>✦</span>
              <span className="sparkle-3 text-sm md:text-lg" style={{ color: 'var(--sky)' }}>✦</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
