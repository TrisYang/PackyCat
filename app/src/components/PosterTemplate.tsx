import React from 'react';
import type { Category } from '@/types';
import { PURPOSES } from '@/constants';
import { getDestImage } from '@/lib/checklist';

interface PosterTemplateProps {
  posterRef: React.RefObject<HTMLDivElement | null>;
  destination: string;
  purpose: string;
  days: number;
  totalCount: number;
  categories: Category[];
  showListOnPoster: boolean;
}

export default function PosterTemplate({
  posterRef,
  destination,
  purpose,
  days,
  totalCount,
  categories,
  showListOnPoster,
}: PosterTemplateProps) {
  return (
    <div ref={posterRef} className="poster-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      <div className="poster-visual"
        style={{ backgroundImage: `url(${getDestImage(destination, purpose)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,251,242,0.2) 0%, rgba(255,251,242,0) 40%, rgba(255,251,242,0.3) 70%, rgba(255,251,242,1) 100%)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
          <img src="./cat-butler.png" alt="小猫管家" className="w-36 h-auto object-contain drop-shadow-xl" draggable={false} />
          <div className="w-20 h-28 rounded-xl -mt-2" style={{ background: 'linear-gradient(180deg, #3A3A3A 0%, #2A2A2A 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div className="w-full h-2 rounded-full mt-2" style={{ background: '#555' }} />
          </div>
          <div className="flex gap-8 -mt-1">
            <div className="w-3 h-3 rounded-full" style={{ background: '#666' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#666' }} />
          </div>
        </div>
        <div className="absolute top-10 left-0 right-0 text-center z-10">
          <p className="text-sm font-semibold tracking-widest" style={{ fontFamily: 'var(--font-body)', color: 'rgba(74,74,74,0.55)', textTransform: 'uppercase' }}>
            {PURPOSES.find(p => p.value === purpose)?.label}
          </p>
          <h1 className="text-5xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', letterSpacing: '-0.02em' }}>{destination}</h1>
          <p className="text-base mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)' }}>{days} 天 · {totalCount} 件行李</p>
        </div>
      </div>
      {showListOnPoster && (
        <div className="poster-list">
          <h2 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', letterSpacing: '-0.02em' }}>Packing List</h2>
          <p className="text-center text-sm mb-8" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)' }}>{destination} - {days} Days</p>
          <div className="space-y-6 px-6">
            {categories.map(cat => (
              <div key={cat.id}>
                <h3 className="text-base font-bold pb-1.5 mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', borderBottom: '2px solid var(--peach)' }}>{cat.name}</h3>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {cat.items.map(item => (
                    <li key={item.id} className="flex items-center text-sm" style={{
                      fontFamily: 'var(--font-body)', color: item.packed ? 'var(--gray-mid)' : 'var(--gray-dark)',
                      textDecoration: item.packed ? 'line-through' : 'none', opacity: item.packed ? 0.5 : 1,
                    }}>
                      <span className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" style={{ background: 'var(--peach)' }} />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pb-10 text-center px-10">
            <p className="text-2xl mb-3" style={{ fontFamily: 'var(--font-hand)', color: 'var(--rose)', lineHeight: 1.5 }}>
              &ldquo;Pack your favorite things and a good mood, let&apos;s go!&rdquo;
            </p>
            <p className="text-xs" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)' }}>Powered by 拾箱小猫 PackyCat</p>
          </div>
        </div>
      )}
    </div>
  );
}
