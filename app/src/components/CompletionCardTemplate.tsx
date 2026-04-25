import React from 'react';
import type { Category } from '@/types';

interface CompletionCardTemplateProps {
  cardRef: React.RefObject<HTMLDivElement | null>;
  destination: string;
  days: number | '';
  totalCount: number;
  categories: Category[];
  hideListInModal: boolean;
  footerText: string;
}

export default function CompletionCardTemplate({
  cardRef,
  destination,
  days,
  totalCount,
  categories,
  hideListInModal,
  footerText,
}: CompletionCardTemplateProps) {
  return (
    <div ref={cardRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: 400, background: '#FFFBF2', padding: 24 }}>
      <img src="./20_lie_on_top.png" alt="" style={{ width: '100%', height: 'auto', borderRadius: 16, marginBottom: 16 }} />
      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 }}>
        猫工打包已完成！✨
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
        辛苦本猫猫忙活半天，要好好夸夸我才行 🐾
      </p>
      <p style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
        📍 目的地 | {destination}
      <br />
      ⏱️ 行程时长 | {days}天
      <br />
      📦 收纳件数 | {totalCount}件
      </p>
      {!hideListInModal && (
        <div style={{ padding: '0 8px' }}>
          {categories.map(cat => (
            <div key={cat.id} style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', fontSize: 14, fontWeight: 'bold', marginBottom: 8, paddingBottom: 4, borderBottom: '2px solid var(--peach)' }}>
                {cat.name}
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cat.items.map(item => (
                  <li key={item.id} style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: 'var(--gray-dark)',
                    marginBottom: 4,
                    position: 'relative',
                    paddingLeft: 14,
                    lineHeight: 1.5,
                  }}>
                    <span style={{ position: 'absolute', left: 0, top: 'calc(0.75em + 7.5px)', width: 6, height: 6, borderRadius: '50%', background: 'var(--peach)', transform: 'translateY(-50%)' }} />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray-mid)', textAlign: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px dashed var(--peach)' }}>
        {footerText}
      </p>
    </div>
  );
}
