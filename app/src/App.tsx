import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Category, TripConfig, TripHistory, PackedSlot, CatAction } from '@/types';
import { PURPOSES } from '@/constants';
import { uid, getCategoryImage, getItemImage, calculateSlot, generateChecklist } from '@/lib/checklist';
import Icon from '@/components/Icon';
import ScenePanel from '@/components/ScenePanel';
import CompletionCardTemplate from '@/components/CompletionCardTemplate';

export default function App() {
  /* ── State ── */
  const [tripConfig, setTripConfig] = useState<TripConfig>({
    destination: '', days: 3, purpose: 'city',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [catState, setCatState] = useState<CatAction>('idle');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TripHistory[]>(() => {
    try { const s = localStorage.getItem('purrpack-history'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [suitcaseClosed, setSuitcaseClosed] = useState(false);
  const [packedSlots, setPackedSlots] = useState<Record<string, PackedSlot>>({});
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [hideListInModal, setHideListInModal] = useState(true);
  const [completionCardUrl, setCompletionCardUrl] = useState<string | null>(null);
  const [generatingCard, setGeneratingCard] = useState(false);
  const randomFooterRef = useRef<string>('');
  if (!randomFooterRef.current) {
    const footers = ['🧳 麻麻要不要偷偷把我一起打包带走呀~', '🏠 在外面要记得想我早点回家陪小猫宝宝~', '😿 外面再好也不要忘记家里等你的小猫咪哦~'];
    randomFooterRef.current = footers[Math.floor(Math.random() * footers.length)];
  }

  const completionCardRef = useRef<HTMLDivElement>(null);

  /* ── Derived ── */
  const allItems = useMemo(() => categories.flatMap(c => c.items), [categories]);
  const packedItems = useMemo(() => allItems.filter(i => i.packed), [allItems]);
  const allPacked = allItems.length > 0 && allItems.every(i => i.packed);
  const packedCount = packedItems.length;
  const totalCount = allItems.length;

  /* ── Persist ── */
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('purrpack-current', JSON.stringify({ categories, config: tripConfig }));
    }
  }, [categories, tripConfig]);
  useEffect(() => {
    localStorage.setItem('purrpack-history', JSON.stringify(history));
  }, [history]);

  /* ── Generate ── */
  const handleGenerate = useCallback(() => {
    if (!tripConfig.destination.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const cats = generateChecklist(tripConfig);
      setCategories(cats);
      setExpandedCats(new Set(cats.map(c => c.id)));
      setSuitcaseClosed(false);
      setPackedSlots({});
      setGenerating(false);
      setIsEditing(false);
      const entry: TripHistory = {
        id: uid(),
        config: { ...tripConfig },
        categories: JSON.parse(JSON.stringify(cats)),
        createdAt: new Date().toISOString(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));
    }, 600);
  }, [tripConfig]);

  /* ── Toggle Item: simple pack/unpack, no cat animation ── */
  const toggleItem = useCallback((catId: string, itemId: string) => {
    setCategories(prev => {
      const next = prev.map(cat => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id !== itemId) return item;
            const newPacked = !item.packed;
            if (newPacked) {
              setPackedSlots(currentSlots => {
                const totalPacked = Object.keys(currentSlots).length;
                const slot = calculateSlot(totalPacked);
                return { ...currentSlots, [itemId]: { ...slot, image: getItemImage(item.text) } };
              });
            } else {
              setPackedSlots(s => { const n = { ...s }; delete n[itemId]; return n; });
            }
            return { ...item, packed: newPacked };
          }),
        };
      });
      return next;
    });
  }, []);

  /* ── Toggle All in Category ── */
  const toggleAllInCat = useCallback((catId: string) => {
    setCategories(prev => {
      const cat = prev.find(c => c.id === catId);
      if (!cat) return prev;
      const allChecked = cat.items.every(i => i.packed);
      const itemsToPack: string[] = [];
      const itemsToUnpack: string[] = [];

      const next = prev.map(c => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map(item => {
            const newPacked = !allChecked;
            if (newPacked && !item.packed) itemsToPack.push(item.id);
            if (!newPacked && item.packed) itemsToUnpack.push(item.id);
            return { ...item, packed: newPacked };
          }),
        };
      });

      // Batch add/remove slots so animation triggers only once
      // When entire category is packed, show only ONE representative image
      if (itemsToPack.length > 0) {
        const catImage = getCategoryImage(cat.name);
        setPackedSlots(currentSlots => {
          const newSlots = { ...currentSlots };
          const totalPacked = Object.keys(newSlots).length;
          newSlots[itemsToPack[0]] = { ...calculateSlot(totalPacked), image: catImage };
          return newSlots;
        });
      }
      if (itemsToUnpack.length > 0) {
        setPackedSlots(currentSlots => {
          const newSlots = { ...currentSlots };
          for (const itemId of itemsToUnpack) delete newSlots[itemId];
          return newSlots;
        });
      }

      return next;
    });
  }, []);

  /* ── Delete Item ── */
  const deleteItem = useCallback((catId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, items: cat.items.filter(i => i.id !== itemId) };
    }));
    setPackedSlots(s => { const n = { ...s }; delete n[itemId]; return n; });
  }, []);

  /* ── Add Item ── */
  const addItem = useCallback((catId: string) => {
    const text = (newItemInputs[catId] || '').trim();
    if (!text) return;
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return { ...cat, items: [...cat.items, { id: uid(), text, packed: false }] };
    }));
    setNewItemInputs(p => ({ ...p, [catId]: '' }));
  }, [newItemInputs]);

  /* ── Delete Category ── */
  const deleteCategory = useCallback((catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
  }, []);

  /* ── Add Category ── */
  const addCategory = useCallback(() => {
    const name = newCatName.trim();
    if (!name) return;
    const cat: Category = { id: uid(), name, icon: 'plus', items: [] };
    setCategories(prev => [...prev, cat]);
    setExpandedCats(prev => new Set([...prev, cat.id]));
    setNewCatName('');
    setAddingCat(false);
  }, [newCatName]);

  /* ── Clear All ── */
  const clearAll = useCallback(() => {
    setCategories([]);
    setPackedSlots({});
    setSuitcaseClosed(false);
  }, []);

  /* ── Load History ── */
  const loadHistory = useCallback((entry: TripHistory) => {
    setTripConfig(entry.config);
    setCategories(entry.categories);
    setExpandedCats(new Set(entry.categories.map(c => c.id)));
    setPackedSlots({});
    setSuitcaseClosed(false);
    setShowHistory(false);
  }, []);

  /* ── Share or Download Image ── */
  const shareOrDownloadImage = useCallback(async (dataUrl: string, filename: string) => {
    if (navigator.canShare && navigator.share) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '拾箱小猫行李清单' });
          return;
        }
      } catch {
        // 用户取消或分享失败，回退到下载
      }
    }
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);

  /* ── Completion Effect ── */
  useEffect(() => {
    if (allPacked && totalCount > 0 && !suitcaseClosed) {
      setCatState('jumping');
      const t = setTimeout(() => setCatState('idle'), 800);
      setShowCompletionModal(true);
      return () => clearTimeout(t);
    }
  }, [allPacked, totalCount, suitcaseClosed]);

  /* ── Generate completion card image ── */
  useEffect(() => {
    if (showCompletionModal && completionCardRef.current) {
      setGeneratingCard(true);
      // Wait for DOM to render
      setTimeout(() => {
        import('html2canvas').then(({ default: html2canvas }) => {
          html2canvas(completionCardRef.current!, {
            scale: 2,
            backgroundColor: '#FFFBF2',
            useCORS: true,
            logging: false,
          }).then(canvas => {
            setCompletionCardUrl(canvas.toDataURL('image/png'));
            setGeneratingCard(false);
          }).catch(err => {
            console.error('html2canvas failed:', err);
            setGeneratingCard(false);
          });
        }).catch(err => {
          console.error('Failed to load html2canvas:', err);
          setGeneratingCard(false);
        });
      }, 100);
    }
  }, [showCompletionModal, hideListInModal]);

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>
      {/* ══════ Top Bar ══════ */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 z-20 relative"
        style={{ background: 'rgba(255,251,242,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(242,212,200,0.3)' }}>
        <div className="flex items-center gap-2">
          <img src="./logo.png" alt="Logo" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)' }}>
            拾箱小猫 PackyCat
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setShowHistory(true)} title="历史记录">
            <Icon name="history" size={18} />
          </button>
          {categories.length > 0 && (
            <button className="icon-btn" onClick={clearAll} title="清空清单">
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ══════ Main Layout ══════ */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Mobile Scene (top, small) ── */}
        <ScenePanel
          isMobile={true}
          days={tripConfig.days}
          destination={tripConfig.destination}
          packedSlots={packedSlots}
          allItems={allItems}
          catState={catState}
          suitcaseClosed={suitcaseClosed}
          hasCategories={categories.length > 0}
          packedCount={packedCount}
          totalCount={totalCount}
          allPacked={allPacked}
        />

        {/* ── Left Panel: Controls ── */}
        <div className="control-panel flex-1 md:flex-none md:w-[320px] lg:w-[340px] flex flex-col overflow-hidden min-h-0"
          style={{ borderRight: '1px solid rgba(242,212,200,0.25)' }}>

          {/* Input Section / Trip Header */}
          <div className="px-4 md:px-5 pt-3 md:pt-4 pb-2 md:pb-3 flex-shrink-0">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-2 md:gap-2.5 mb-2 md:mb-2.5">
                  <input className="cute-input col-span-1" placeholder="目的地..."
                    value={tripConfig.destination}
                    onChange={e => setTripConfig(p => ({ ...p, destination: e.target.value }))}
                  />
                  <input className="cute-input col-span-1" type="number" min={1} max={30} placeholder="天数"
                    value={tripConfig.days || ''}
                    onChange={e => setTripConfig(p => ({ ...p, days: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <select className="cute-select w-full mb-2 md:mb-3"
                  value={tripConfig.purpose}
                  onChange={e => setTripConfig(p => ({ ...p, purpose: e.target.value }))}>
                  {PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <button className="cute-btn w-full flex items-center justify-center gap-2"
                  onClick={handleGenerate}
                  disabled={!tripConfig.destination.trim() || generating}
                  style={{ background: '#F2A8A0', opacity: !tripConfig.destination.trim() || generating ? 0.6 : 1 }}>
                  {generating ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </span>
                  ) : (
                    <><Icon name="sparkles" size={16} /> 生成清单</>
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-sm md:text-base font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)' }}>
                    {tripConfig.destination}{tripConfig.days}日游
                  </h2>
                  <p className="text-[11px]" style={{ color: 'var(--gray-mid)' }}>
                    {PURPOSES.find(p => p.value === tripConfig.purpose)?.label}
                  </p>
                </div>
                <button
                  className="icon-btn flex-shrink-0 ml-2"
                  onClick={() => setIsEditing(true)}
                  title="修改行程"
                >
                  <Icon name="undo" size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Progress */}
          {categories.length > 0 && (
            <div className="px-4 md:px-5 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--gray-mid)', fontFamily: 'var(--font-body)' }}>收纳进度</span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--rose)', fontFamily: 'var(--font-body)' }}>{packedCount} / {totalCount}</span>
              </div>
              <div className="h-1.5 md:h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-light)' }}>
                <div className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%`, background: 'linear-gradient(90deg, var(--peach), var(--rose))' }} />
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="flex-1 overflow-y-auto px-4 md:px-5 pb-4 min-h-0">
            {categories.length === 0 && !generating && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <Icon name="paw" size={40} />
                <p className="mt-3 text-sm" style={{ color: 'var(--gray-mid)' }}>
                  输入目的地和天数<br />让拾箱小猫 PackyCat 为你整理行李
                </p>
              </div>
            )}
            {generating && categories.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'var(--peach)' }}>
                  <Icon name="paw" size={20} />
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--gray-mid)' }}>拾箱小猫 PackyCat 正在思考...</p>
              </div>
            )}

            {categories.map((cat, catIdx) => {
              const catPacked = cat.items.filter(i => i.packed).length;
              const catAllPacked = cat.items.length > 0 && cat.items.every(i => i.packed);
              const isExpanded = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="category-card fade-in-up" style={{ animationDelay: `${catIdx * 60}ms`, padding: '12px 14px' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <button className="flex items-center gap-2 flex-1 text-left min-w-0"
                      onClick={() => setExpandedCats(p => { const n = new Set(p); if (n.has(cat.id)) n.delete(cat.id); else n.add(cat.id); return n; })}>
                      <span style={{ color: cat.isBonus ? 'var(--sky)' : 'var(--peach)' }}><Icon name={cat.icon} size={16} /></span>
                      <span className="text-xs md:text-sm font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)' }}>{cat.name}</span>
                      {cat.isBonus && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: 'var(--sky)', color: 'white' }}>推荐</span>}
                      <span className="text-[10px] ml-1 flex-shrink-0" style={{ color: 'var(--gray-mid)' }}>{catPacked}/{cat.items.length}</span>
                      <span className="ml-auto flex-shrink-0" style={{ color: 'var(--gray-mid)' }}><Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={13} /></span>
                    </button>
                    <div className="flex items-center gap-0.5 ml-1.5 flex-shrink-0">
                      {cat.items.length > 0 && (
                        <button className="icon-btn" style={{ width: 26, height: 26, borderRadius: 8 }} onClick={() => toggleAllInCat(cat.id)} title={catAllPacked ? "取消全选" : "全选"}>
                          <div className="w-3.5 h-3.5 rounded flex items-center justify-center transition-all"
                            style={{ background: catAllPacked ? 'var(--peach)' : 'transparent', border: `2px solid ${catAllPacked ? 'var(--peach)' : 'var(--gray-light)'}` }}>
                            {catAllPacked && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>
                        </button>
                      )}
                      <button className="icon-btn" style={{ width: 26, height: 26, borderRadius: 8 }} onClick={() => deleteCategory(cat.id)} title="删除分类">
                        <Icon name="trash" size={12} />
                      </button>
                    </div>
                  </div>
                  {/* Items */}
                  {isExpanded && (
                    <div className="space-y-0.5">
                      {cat.items.map((item) => (
                        <div key={item.id}
                          className="flex items-center gap-2 py-1 px-1 rounded-lg transition-all duration-200 group"
                          style={{ opacity: item.packed ? 0.45 : 1, background: item.packed ? 'rgba(242,212,200,0.08)' : 'transparent' }}>
                          <input type="checkbox" className="custom-checkbox" checked={item.packed} onChange={() => toggleItem(cat.id, item.id)} />
                          <span className="flex-1 text-xs md:text-sm transition-all truncate" style={{
                            fontFamily: 'var(--font-body)', color: item.packed ? 'var(--gray-mid)' : 'var(--gray-dark)',
                            textDecoration: item.packed ? 'line-through' : 'none',
                          }}>{item.text}</span>
                          <button className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity" style={{ width: 22, height: 22, borderRadius: 6 }} onClick={() => deleteItem(cat.id, item.id)}>
                            <Icon name="minus" size={11} />
                          </button>
                        </div>
                      ))}
                      {/* Add Item */}
                      <div className="flex items-center gap-2 mt-1.5 pt-1">
                        <input className="cute-input text-xs py-1.5" style={{ borderRadius: 10 }}
                          placeholder="+ 添加物品..."
                          value={newItemInputs[cat.id] || ''}
                          onChange={e => setNewItemInputs(p => ({ ...p, [cat.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addItem(cat.id)}
                        />
                        <button className="icon-btn flex-shrink-0" style={{
                          width: 28, height: 28, borderRadius: 10,
                          background: (newItemInputs[cat.id] || '').trim() ? 'var(--peach)' : 'transparent',
                          color: (newItemInputs[cat.id] || '').trim() ? 'white' : 'var(--gray-mid)',
                        }} onClick={() => addItem(cat.id)}>
                          <Icon name="plus" size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Category */}
            {categories.length > 0 && (
              <div className="mt-1.5">
                {addingCat ? (
                  <div className="flex items-center gap-2 fade-in-up">
                    <input className="cute-input text-xs py-1.5 flex-1" style={{ borderRadius: 10 }}
                      placeholder="分类名称..." value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCategory()} autoFocus
                    />
                    <button className="cute-btn" style={{ padding: '7px 14px', fontSize: 11, borderRadius: 10 }} onClick={addCategory}>确认</button>
                    <button className="icon-btn" onClick={() => { setAddingCat(false); setNewCatName(''); }}><Icon name="x" size={13} /></button>
                  </div>
                ) : (
                  <button className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold transition-all hover:opacity-80"
                    style={{ border: '2px dashed var(--gray-light)', color: 'var(--gray-mid)', background: 'transparent' }}
                    onClick={() => setAddingCat(true)}>
                    <Icon name="plus" size={13} /> 添加分类
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Desktop Scene (right, large) ── */}
        <ScenePanel
          isMobile={false}
          days={tripConfig.days}
          destination={tripConfig.destination}
          packedSlots={packedSlots}
          allItems={allItems}
          catState={catState}
          suitcaseClosed={suitcaseClosed}
          hasCategories={categories.length > 0}
          packedCount={packedCount}
          totalCount={totalCount}
          allPacked={allPacked}
        />
      </div>

      {/* ══════ History Panel ══════ */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm mx-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)' }}>历史记录</h3>
              <button className="icon-btn" onClick={() => setShowHistory(false)}><Icon name="x" size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--gray-mid)' }}>暂无历史记录</p>
              ) : (
                history.map(entry => (
                  <button key={entry.id}
                    className="w-full text-left p-3 rounded-xl transition-all hover:shadow-md"
                    style={{ background: 'rgba(242,212,200,0.12)', border: '1px solid rgba(242,212,200,0.2)' }}
                    onClick={() => loadHistory(entry)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold" style={{ color: 'var(--gray-dark)' }}>{entry.config.destination}</span>
                      <span className="text-xs" style={{ color: 'var(--gray-mid)' }}>{entry.config.days}天</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs" style={{ color: 'var(--gray-mid)' }}>{PURPOSES.find(p => p.value === entry.config.purpose)?.label}</span>
                      <span className="text-[10px]" style={{ color: 'var(--gray-mid)' }}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}


      {/* ══════ Completion Modal ══════ */}
      {showCompletionModal && (
        <div className="modal-overlay" style={{ zIndex: 200, alignItems: 'flex-start', paddingTop: '5vh', paddingBottom: '5vh', overflowY: 'auto' }} onClick={() => setShowCompletionModal(false)}>
          <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            {/* Generated card image */}
            {generatingCard ? (
              <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center" style={{ minHeight: 300 }}>
                <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--peach)' }} />
              </div>
            ) : completionCardUrl ? (
              <img
                src={completionCardUrl}
                alt="收拾完毕"
                className="w-full rounded-2xl shadow-xl"
                style={{ objectFit: 'contain' }}
              />
            ) : null}
            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2">
              <input
                type="checkbox"
                className="custom-checkbox"
                checked={hideListInModal}
                onChange={e => setHideListInModal(e.target.checked)}
              />
              <span className="text-sm" style={{ color: 'var(--gray-mid)' }}>隐藏清单内容</span>
            </label>
            {/* Buttons */}
            <div className="flex gap-2 w-full">
              <button className="cute-btn-secondary cute-btn flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => setShowCompletionModal(false)}>
                <Icon name="x" size={15} /> 返回清单
              </button>
              {completionCardUrl && (
                <button className="cute-btn flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => {
                  shareOrDownloadImage(completionCardUrl, `PackyCat-${tripConfig.destination || 'trip'}.png`);
                }}>
                  <Icon name="download" size={15} /> 保存图片
                </button>
              )}
            </div>
            <button
              className="w-full cute-btn flex items-center justify-center gap-2 text-sm"
              style={{ background: 'var(--sky)' }}
              onClick={() => {
                setShowCompletionModal(false);
                setCategories([]);
                setPackedSlots({});
                setSuitcaseClosed(false);
                setIsEditing(true);
                setTripConfig({ destination: '', days: 3, purpose: 'city' });
              }}
            >
              <Icon name="sparkles" size={15} /> 生成下一次旅行清单
            </button>
          </div>
        </div>
      )}

      <CompletionCardTemplate
        cardRef={completionCardRef}
        destination={tripConfig.destination}
        days={tripConfig.days}
        totalCount={totalCount}
        categories={categories}
        hideListInModal={hideListInModal}
        footerText={randomFooterRef.current}
      />
    </div>
  );
}

