import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
interface ChecklistItem {
  id: string;
  text: string;
  packed: boolean;
}

interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
  isBonus?: boolean;
  icon: string;
}

interface TripConfig {
  destination: string;
  days: number;
  purpose: string;
}

interface TripHistory {
  id: string;
  config: TripConfig;
  categories: Category[];
  createdAt: string;
}

interface PackedSlot {
  x: number;   // % from left
  y: number;   // % from bottom
  rotate: number;
  layer: number;
  scale: number;
}

type FlightPhase = 'none' | 'to-cat' | 'at-cat' | 'to-suitcase' | 'in-suitcase' | 'removing';

interface FlightState {
  itemId: string;
  phase: FlightPhase;
}

type CatAction = 'idle' | 'reaching' | 'holding' | 'placing' | 'removing' | 'jumping' | 'pulling';

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */
const PURPOSES = [
  { value: 'city', label: '城市旅行' },
  { value: 'beach', label: '海边度假' },
  { value: 'hiking', label: '户外徒步' },
  { value: 'business', label: '商务出差' },
  { value: 'family', label: '探亲访友' },
];

const ITEM_IMAGES: Record<string, string> = {
  // 证件与财物
  'item-passport': '/item_passport.png',
  'item-wallet': '/item_wallet.png',
  // 衣物穿搭
  'item-shirt': '/item_shirt.png',
  'item-pants': '/item_pants.png',
  'item-dress': '/item_dress.png',
  'item-socks': '/item_socks.png',
  'item-jacket': '/item_jacket.png',
  'item-scarf': '/item_scarf.png',
  // 洗护健康
  'item-toiletries': '/item_toiletries.png',
  'item-skincare': '/item_skincare.png',
  'item-mask': '/item_mask.png',
  // 电子设备 & 摄影
  'item-charger': '/item_charger.png',
  'item-camera': '/item_camera.png',
  'item-sunglasses': '/item_sunglasses.png',
  // 其他
  'item-shoes': '/item_shoes.png',
  'item-pouch': '/item_pouch.png',
  'item-hat': '/item_hat.png',
  'item-sunhat': '/item_sunhat.png',
};

const DEST_IMAGES: Record<string, string> = {
  paris: '/dest-paris.jpg',
  tokyo: '/dest-tokyo.jpg',
  beach: '/dest-beach.jpg',
  mountain: '/dest-mountain.jpg',
  city: '/dest-city.jpg',
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ═══════════════════════════════════════════════
   Helpers: Images
   ═══════════════════════════════════════════════ */
function getDestImage(destination: string, purpose: string): string {
  const d = destination.toLowerCase();
  if (d.includes('paris') || d.includes('巴黎')) return DEST_IMAGES.paris;
  if (d.includes('tokyo') || d.includes('东京') || d.includes('京都') || d.includes('大阪')) return DEST_IMAGES.tokyo;
  if (d.includes('beach') || d.includes('海') || d.includes('岛')) return DEST_IMAGES.beach;
  if (purpose === 'hiking' || d.includes('mountain') || d.includes('山')) return DEST_IMAGES.mountain;
  return DEST_IMAGES.city;
}

function getItemImage(itemName: string): string {
  const n = itemName.toLowerCase();

  /* ── 证件与财物 ── */
  if (n.includes('护照') || n.includes('身份证') || n.includes('行程单')) return ITEM_IMAGES['item-passport'];
  if (n.includes('银行卡') || n.includes('现金') || n.includes('钱包') || n.includes('名片')) return ITEM_IMAGES['item-wallet'];

  /* ── 衣物穿搭 ── */
  if (n.includes('t恤') || n.includes('衬衫') || n.includes('背心') || (n.includes('衣') && !n.includes('雨衣'))) return ITEM_IMAGES['item-shirt'];
  if ((n.includes('裤') || n.includes('裙')) && !n.includes('内衣')) return ITEM_IMAGES['item-pants'];
  if (n.includes('睡衣')) return ITEM_IMAGES['item-dress'];
  if (n.includes('袜') || n.includes('内衣')) return ITEM_IMAGES['item-socks'];
  if (n.includes('外套') || n.includes('夹克') || n.includes('雨衣') || n.includes('西装')) return ITEM_IMAGES['item-jacket'];
  if (n.includes('围巾') || n.includes('伞')) return ITEM_IMAGES['item-scarf'];

  /* ── 洗护健康 ── */
  if (n.includes('洗漱') || n.includes('牙') || n.includes('浴') || n.includes('化妆')) return ITEM_IMAGES['item-toiletries'];
  if (n.includes('洗') || n.includes('护') || n.includes('霜') || n.includes('液') || n.includes('防晒') || n.includes('卸妆') || n.includes('精华')) return ITEM_IMAGES['item-skincare'];
  if (n.includes('药') || n.includes('面膜') || n.includes('能量')) return ITEM_IMAGES['item-mask'];

  /* ── 电子设备 & 摄影 ── */
  if (n.includes('相机') || n.includes('三脚架')) return ITEM_IMAGES['item-camera'];
  if (n.includes('充电') || n.includes('插头') || n.includes('转换') || n.includes('电池')) return ITEM_IMAGES['item-charger'];
  if (n.includes('耳机') || n.includes('电脑') || n.includes('笔记本') || n.includes('电子') || n.includes('设备')) return ITEM_IMAGES['item-sunglasses'];

  /* ── 鞋帽包 & 其他 ── */
  if (n.includes('鞋') || n.includes('拖')) return ITEM_IMAGES['item-shoes'];
  if (n.includes('收纳') || n.includes('袋') || n.includes('包') || n.includes('防水') || n.includes('手机袋')) return ITEM_IMAGES['item-pouch'];
  if (n.includes('遮阳帽') || n.includes('沙滩帽')) return ITEM_IMAGES['item-sunhat'];
  if (n.includes('帽')) return ITEM_IMAGES['item-hat'];

  return ITEM_IMAGES['item-passport'];
}

/* ═══════════════════════════════════════════════
   Layered Packing Algorithm
   Items are placed in organized layers within suitcase
   ═══════════════════════════════════════════════ */
function getItemLayer(itemName: string): number {
  const n = itemName.toLowerCase();
  // Layer 0 = bottom (clothes, flat items)
  if (n.includes('t恤') || n.includes('衬衫') || n.includes('裤') || n.includes('服') || n.includes('睡衣') || n.includes('内衣') || n.includes('袜') || n.includes('鞋') || n.includes('裙') || n.includes('衫')) return 0;
  // Layer 1 = middle (toiletry, soft items)
  if (n.includes('洗') || n.includes('护') || n.includes('霜') || n.includes('膏') || n.includes('液') || n.includes('牙') || n.includes('防晒') || n.includes('卸妆') || n.includes('药') || n.includes('浴') || n.includes('化妆')) return 1;
  // Layer 2 = top (hard items, electronics, documents)
  return 2;
}

function calculateSlot(packedCountByLayer: [number, number, number], layer: number): PackedSlot {
  const count = packedCountByLayer[layer];
  const colsPerLayer = [4, 3, 3];
  const cols = colsPerLayer[layer];
  const col = count % cols;

  // x: spread across 0-80 range (inner container is 80% of suitcase width)
  const x = col * (85 / cols) + 5 + (Math.random() - 0.5) * 6;
  // y: each layer has its own zone within the inner container
  const y = (Math.random() - 0.5) * 8;
  const rotate = [-4, -1, 2, 5][col % 4] + (Math.random() - 0.5) * 3;
  const scale = layer === 2 ? 1.05 : layer === 0 ? 0.9 : 1.0;

  return { x, y, rotate, layer, scale };
}

/* ═══════════════════════════════════════════════
   Smart Checklist Generator
   ═══════════════════════════════════════════════ */
function generateChecklist(config: TripConfig): Category[] {
  const { days, purpose } = config;
  const d = Math.max(1, Math.min(days, 30));

  const baseCategories: Category[] = [
    {
      id: uid(), name: '证件与财物', icon: 'shield',
      items: [
        { id: uid(), text: '身份证', packed: false },
        { id: uid(), text: '护照', packed: false },
        { id: uid(), text: '银行卡', packed: false },
        { id: uid(), text: '现金', packed: false },
        { id: uid(), text: '行程单', packed: false },
      ],
    },
    {
      id: uid(), name: '衣物穿搭', icon: 'shirt',
      items: [
        { id: uid(), text: `轻便T恤 x${Math.min(d, 5)}`, packed: false },
        { id: uid(), text: d > 3 ? '薄款长袖衬衫' : '内搭背心', packed: false },
        { id: uid(), text: '舒适长裤', packed: false },
        { id: uid(), text: '睡衣套装', packed: false },
        { id: uid(), text: '内衣裤 x' + Math.min(d + 1, 7), packed: false },
        { id: uid(), text: '袜子 x' + Math.min(d + 1, 7), packed: false },
        { id: uid(), text: '轻便外套', packed: false },
        { id: uid(), text: '折叠雨伞', packed: false },
      ],
    },
    {
      id: uid(), name: '洗护健康', icon: 'droplet',
      items: [
        { id: uid(), text: '旅行装洗面奶', packed: false },
        { id: uid(), text: '保湿乳液', packed: false },
        { id: uid(), text: '牙刷牙膏', packed: false },
        { id: uid(), text: '防晒霜', packed: false },
        { id: uid(), text: '卸妆水', packed: false },
        { id: uid(), text: '常用药品', packed: false },
      ],
    },
    {
      id: uid(), name: '电子设备', icon: 'smartphone',
      items: [
        { id: uid(), text: '充电宝', packed: false },
        { id: uid(), text: '充电线', packed: false },
        { id: uid(), text: '降噪耳机', packed: false },
        { id: uid(), text: '转换插头', packed: false },
      ],
    },
  ];

  const bonusMap: Record<string, Category> = {
    city: {
      id: uid(), name: '摄影器材', icon: 'camera', isBonus: true,
      items: [
        { id: uid(), text: '相机', packed: false },
        { id: uid(), text: '备用电池', packed: false },
        { id: uid(), text: '三脚架', packed: false },
      ],
    },
    beach: {
      id: uid(), name: '沙滩装备', icon: 'umbrella', isBonus: true,
      items: [
        { id: uid(), text: '泳衣', packed: false },
        { id: uid(), text: '沙滩拖鞋', packed: false },
        { id: uid(), text: '防水手机袋', packed: false },
        { id: uid(), text: '遮阳帽', packed: false },
      ],
    },
    hiking: {
      id: uid(), name: '户外装备', icon: 'mountain', isBonus: true,
      items: [
        { id: uid(), text: '登山鞋', packed: false },
        { id: uid(), text: '登山杖', packed: false },
        { id: uid(), text: '便携雨衣', packed: false },
        { id: uid(), text: '头灯', packed: false },
        { id: uid(), text: '能量棒', packed: false },
      ],
    },
    business: {
      id: uid(), name: '商务用品', icon: 'briefcase', isBonus: true,
      items: [
        { id: uid(), text: '笔记本电脑', packed: false },
        { id: uid(), text: '正装衬衫 x2', packed: false },
        { id: uid(), text: '西装外套', packed: false },
        { id: uid(), text: '名片夹', packed: false },
      ],
    },
  };

  const bonus = bonusMap[purpose];
  if (bonus) baseCategories.push(bonus);
  return baseCategories;
}

/* ═══════════════════════════════════════════════
   SVG Icons
   ═══════════════════════════════════════════════ */
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const s = size;
  const c = "currentColor";
  const sw = 2;
  const r = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  const icons: Record<string, React.ReactNode> = {
    shield: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>,
    shirt: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>,
    droplet: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>,
    smartphone: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
    camera: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    umbrella: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M22 12a10.06 10.06 1 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></svg>,
    mountain: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>,
    briefcase: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    history: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    trash: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
    plus: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
    minus: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M5 12h14"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
    chevronDown: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m6 9 6 6 6-6"/></svg>,
    chevronUp: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m18 15-6-6-6 6"/></svg>,
    sparkles: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    download: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>,
    undo: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>,
    paw: <svg width={s} height={s} viewBox="0 0 24 24" {...r}><circle cx="11" cy="9" r="3"/><circle cx="17" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="11" r="2"/><circle cx="3" cy="11" r="2"/><path d="m10 14 1 3 1-3"/></svg>,
  };
  return icons[name] || null;
}

/* ═══════════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════════ */
export default function App() {
  /* ── State ── */
  const [tripConfig, setTripConfig] = useState<TripConfig>({
    destination: '', days: 5, purpose: 'city',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [flight, setFlight] = useState<FlightState>({ itemId: '', phase: 'none' });
  const [catState, setCatState] = useState<CatAction>('idle');
  const [handItemId, setHandItemId] = useState<string | null>(null);
  const [showPoster, setShowPoster] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<TripHistory[]>(() => {
    try { const s = localStorage.getItem('purrpack-history'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showListOnPoster] = useState(true);
  const [suitcaseClosed, setSuitcaseClosed] = useState(false);
  const [packedSlots, setPackedSlots] = useState<Record<string, PackedSlot>>({});
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const posterRef = useRef<HTMLDivElement>(null);

  /* ── Derived ── */
  const allItems = useMemo(() => categories.flatMap(c => c.items), [categories]);
  const packedItems = useMemo(() => allItems.filter(i => i.packed), [allItems]);
  const allPacked = allItems.length > 0 && allItems.every(i => i.packed);
  const packedCount = packedItems.length;
  const totalCount = allItems.length;

  /* ── Load from localStorage ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('purrpack-current');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.categories?.length > 0) {
          setCategories(parsed.categories);
          setTripConfig(parsed.config || tripConfig);
          setExpandedCats(new Set(parsed.categories.map((c: Category) => c.id)));
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const entry: TripHistory = {
        id: uid(),
        config: { ...tripConfig },
        categories: JSON.parse(JSON.stringify(cats)),
        createdAt: new Date().toISOString(),
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));
    }, 600);
  }, [tripConfig]);

  /* ── Toggle Item with full flight animation ── */
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
              /* ═══ PACK flow: checklist → cat's hand → suitcase ═══ */
              // Phase 1: item flies to cat (0-300ms)
              setFlight({ itemId, phase: 'to-cat' });
              setCatState('reaching');

              // Phase 2: item lands on cat's hand (300ms)
              setTimeout(() => {
                setFlight({ itemId, phase: 'at-cat' });
                setHandItemId(itemId);
                setCatState('holding');
              }, 300);

              // Phase 3: item flies from cat to suitcase (600-1100ms)
              setTimeout(() => {
                setFlight({ itemId, phase: 'to-suitcase' });
                setCatState('placing');
                setHandItemId(null);
              }, 600);

              // Phase 4: item lands in suitcase, assign slot (1100ms)
              setTimeout(() => {
                setFlight({ itemId, phase: 'in-suitcase' });
                setCatState('idle');
                const layer = getItemLayer(item.text);
                const currentCounts: [number, number, number] = [0, 0, 0];
                setPackedSlots(currentSlots => {
                  for (const sid of Object.keys(currentSlots)) {
                    const s = currentSlots[sid];
                    if (s) currentCounts[s.layer]++;
                  }
                  const slot = calculateSlot(currentCounts, layer);
                  return { ...currentSlots, [itemId]: slot };
                });
                // Clear flight after a brief pause
                setTimeout(() => setFlight({ itemId: '', phase: 'none' }), 200);
              }, 1100);

            } else {
              /* ═══ UNPACK flow: suitcase → cat's hand → away ═══ */
              setFlight({ itemId, phase: 'removing' });
              setCatState('removing');
              setHandItemId(itemId);

              // Remove slot immediately (item starts leaving)
              setPackedSlots(s => { const n = { ...s }; delete n[itemId]; return n; });

              // After removal animation, clear
              setTimeout(() => {
                setFlight({ itemId: '', phase: 'none' });
                setCatState('idle');
                setHandItemId(null);
              }, 500);
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
      const next = prev.map(c => {
        if (c.id !== catId) return c;
        return {
          ...c,
          items: c.items.map((item, idx) => {
            const newPacked = !allChecked;
            if (newPacked && !item.packed) {
              const delay = idx * 600; // stagger each item
              setTimeout(() => {
                // Quick pack: to-cat → at-cat → to-suitcase → in-suitcase
                setFlight({ itemId: item.id, phase: 'to-cat' });
                setCatState('reaching');
                setTimeout(() => { setFlight({ itemId: item.id, phase: 'at-cat' }); setHandItemId(item.id); setCatState('holding'); }, 200);
                setTimeout(() => { setFlight({ itemId: item.id, phase: 'to-suitcase' }); setHandItemId(null); setCatState('placing'); }, 400);
                setTimeout(() => {
                  setFlight({ itemId: item.id, phase: 'in-suitcase' });
                  setCatState(idx === cat.items.length - 1 ? 'idle' : 'reaching');
                  const layer = getItemLayer(item.text);
                  setPackedSlots(currentSlots => {
                    const counts: [number, number, number] = [0, 0, 0];
                    for (const sid of Object.keys(currentSlots)) { const s = currentSlots[sid]; if (s) counts[s.layer]++; }
                    const slot = calculateSlot(counts, layer);
                    return { ...currentSlots, [item.id]: slot };
                  });
                  setTimeout(() => setFlight({ itemId: '', phase: 'none' }), 150);
                }, 800);
              }, delay);
            } else if (!newPacked && item.packed) {
              setPackedSlots(s => { const n = { ...s }; delete n[item.id]; return n; });
            }
            return { ...item, packed: newPacked };
          }),
        };
      });
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

  /* ── Generate Poster ── */
  const generatePoster = useCallback(async () => {
    if (!posterRef.current) return;
    setCatState('pulling');
    setSuitcaseClosed(true);
    await new Promise(r => setTimeout(r, 900));
    const canvas = await html2canvas(posterRef.current, {
      scale: 2, backgroundColor: '#FFFBF2', useCORS: true, logging: false,
    });
    setPosterUrl(canvas.toDataURL('image/png'));
    setShowPoster(true);
    setCatState('idle');
  }, []);

  /* ── Download Poster ── */
  const downloadPoster = useCallback(() => {
    if (!posterUrl) return;
    const link = document.createElement('a');
    link.download = `PurrPack-${tripConfig.destination || 'trip'}.png`;
    link.href = posterUrl;
    link.click();
  }, [posterUrl, tripConfig.destination]);

  /* ── Completion Effect ── */
  useEffect(() => {
    if (allPacked && totalCount > 0 && !suitcaseClosed) {
      setCatState('jumping');
      const t = setTimeout(() => setCatState('idle'), 800);
      return () => clearTimeout(t);
    }
  }, [allPacked, totalCount, suitcaseClosed]);

  /* ═══════════════════════════════════════════════
     Suitcase size by days
     ═══════════════════════════════════════════════ */
  const suitcaseSize = useMemo(() => {
    const d = tripConfig.days || 5;
    // Flat open suitcase: larger to dominate the scene
    if (d <= 3) return { desktop: { w: 520, h: 347 }, mobile: { w: 200, h: 133 } };
    if (d <= 7) return { desktop: { w: 600, h: 400 }, mobile: { w: 240, h: 160 } };
    if (d <= 14) return { desktop: { w: 660, h: 440 }, mobile: { w: 280, h: 187 } };
    return { desktop: { w: 720, h: 480 }, mobile: { w: 320, h: 213 } };
  }, [tripConfig.days]);

  /* ═══════════════════════════════════════════════
     Sub-Component: Scene Panel — Flat Suitcase Layout
     Cat lies inside a flat-open suitcase
     ═══════════════════════════════════════════════ */
  const ScenePanel = ({ isMobile = false }: { isMobile?: boolean }) => {
    const sz = isMobile ? suitcaseSize.mobile : suitcaseSize.desktop;
    const catW = isMobile ? 55 : 140; // fixed cat size regardless of suitcase
    const flightItem = flight.itemId ? allItems.find(i => i.id === flight.itemId) : null;
    const flightImg = flightItem ? getItemImage(flightItem.text) : '';
    const br = isMobile ? 8 : 16;
    const days = tripConfig.days || 5;
    const suitcaseImg = days <= 3 ? '/v2_suitcase_small_black.png' : days <= 7 ? '/v2_suitcase_medium_black.png' : '/v2_suitcase_large_black.png';

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
      <div className={`scene-panel relative overflow-hidden ${isMobile ? 'flex md:hidden' : 'hidden md:flex flex-1'}`}>

        {/* ══════ LAYER 1: Background (always fixed) ══════ */}
        <div className="absolute inset-0" style={{ backgroundImage: 'url(/room-floor-2.png)', backgroundSize: 'cover', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat' }} />
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

          {/* Items placed inside right half — strictly within gray lining */}
          <div style={{ position: 'absolute', left: '55%', top: '24%', right: '4%', bottom: '26%', zIndex: 15, overflow: 'hidden' }}>
            {Object.entries(packedSlots).map(([itemId, slot]) => {
              const item = allItems.find(i => i.id === itemId);
              if (!item) return null;
              const layerYBase = [10, 40, 70][slot.layer];
              const x = 5 + (slot.x % 85);
              const y = layerYBase + (slot.y % 25);
              const itemSize = isMobile ? 70 : (22 + slot.layer * 3) * 5;
              return (
                <div key={itemId} className="packed-item-visual" style={{
                  left: `${x}%`, bottom: `${y}%`,
                  width: itemSize, height: itemSize,
                  zIndex: 20 + slot.layer * 25,
                  transform: `rotate(${slot.rotate}deg)`,
                }}>
                  <img src={getItemImage(item.text)} alt={item.text} className="w-full h-full object-contain" draggable={false} />
                </div>
              );
            })}
          </div>

          {/* === Cat lying inside left half — fixed corner position === */}
          <div className={`absolute z-30 ${catAnimClass}`} style={{
            left: '6%', top: '22%',
            width: catW,
          }}>
            <img src="/cat-sleeping.png" alt="小猫管家" style={{ width: '100%', height: 'auto' }} className="object-contain drop-shadow-lg" draggable={false} />

            {/* Item held in cat's hand */}
            {handItemId && flight.phase === 'at-cat' && flightItem && (
              <div className="absolute" style={{
                left: '30%', top: '20%',
                width: isMobile ? 100 : 150,
                height: isMobile ? 100 : 150,
                zIndex: 35,
                animation: 'fly-to-cat 0.3s ease-out forwards',
              }}>
                <img src={flightImg} alt="" className="w-full h-full object-contain drop-shadow-md" draggable={false} />
              </div>
            )}

            {/* Item being removed */}
            {handItemId && flight.phase === 'removing' && flightItem && (
              <div className="absolute" style={{
                left: '30%', top: '20%',
                width: isMobile ? 100 : 150,
                height: isMobile ? 100 : 150,
                zIndex: 35,
                animation: 'fly-from-suitcase 0.4s ease-in forwards',
              }}>
                <img src={flightImg} alt="" className="w-full h-full object-contain drop-shadow-md" draggable={false} />
              </div>
            )}
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

        {/* ══════ LAYER 4: Flying Items ══════ */}
        {/* Item flying from checklist TO cat's hand (left half corner) */}
        {flight.phase === 'to-cat' && flightItem && (
          <div className="absolute z-40" style={{
            left: `calc(50% - ${sz.w * 0.38}px)`,
            bottom: `calc(${isMobile ? 20 : 40}px + ${sz.h * 0.6}px)`,
            width: isMobile ? 120 : 200,
            height: isMobile ? 120 : 200,
            animation: 'fly-to-cat 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}>
            <img src={flightImg} alt="" className="w-full h-full object-contain drop-shadow-lg" draggable={false} />
          </div>
        )}

        {/* Item flying FROM cat's hand TO inside suitcase (right half) */}
        {flight.phase === 'to-suitcase' && flightItem && (
          <div className="absolute z-40" style={{
            left: `calc(50% + ${sz.w * 0.08}px)`,
            bottom: `calc(${isMobile ? 20 : 40}px + ${sz.h * 0.5}px)`,
            width: isMobile ? 100 : 160,
            height: isMobile ? 100 : 160,
            animation: 'fly-to-suitcase 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          }}>
            <img src={flightImg} alt="" className="w-full h-full object-contain drop-shadow-lg" draggable={false} />
          </div>
        )}

        {/* ══════ UI Overlay ══════ */}
        {categories.length > 0 && (
          <div className="absolute top-3 md:top-6 left-3 md:left-6 right-3 md:right-6 z-50 flex justify-between items-start">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-3 md:px-4 py-1.5 md:py-2 shadow-sm">
              <p className="text-[10px] md:text-xs font-semibold" style={{ color: 'var(--gray-mid)', fontFamily: 'var(--font-body)' }}>{tripConfig.destination}</p>
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

        {/* Completion Text */}
        {allPacked && totalCount > 0 && (
          <div className="absolute bottom-1 md:bottom-3 left-0 right-0 z-50 text-center fade-in-up">
            <p className="text-xs md:text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--rose)' }}>全部收拾完毕！</p>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════ */
  return (
    <div className="w-screen h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>
      {/* ══════ Top Bar ══════ */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 z-20 relative"
        style={{ background: 'rgba(255,251,242,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(242,212,200,0.3)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--peach)' }}>
            <Icon name="paw" size={16} />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)' }}>
            PurrPack
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
          {allPacked && (
            <button className="icon-btn" onClick={generatePoster} title="生成旅行卡片" style={{ color: 'var(--rose)' }}>
              <Icon name="sparkles" size={18} />
            </button>
          )}
        </div>
      </header>

      {/* ══════ Main Layout ══════ */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden">

        {/* ── Mobile Scene (top, small) ── */}
        <ScenePanel isMobile={true} />

        {/* ── Left Panel: Controls ── */}
        <div className="control-panel flex-1 md:flex-none md:w-[320px] lg:w-[340px] flex flex-col overflow-hidden min-h-0"
          style={{ borderRight: '1px solid rgba(242,212,200,0.25)' }}>

          {/* Input Section */}
          <div className="px-4 md:px-5 pt-3 md:pt-4 pb-2 md:pb-3 flex-shrink-0">
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
              style={{ opacity: !tripConfig.destination.trim() || generating ? 0.6 : 1 }}>
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
                  输入目的地和天数<br />让小猫管家为你整理行李
                </p>
              </div>
            )}
            {generating && categories.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center animate-pulse" style={{ background: 'var(--peach)' }}>
                  <Icon name="paw" size={20} />
                </div>
                <p className="mt-3 text-sm" style={{ color: 'var(--gray-mid)' }}>小猫管家正在思考...</p>
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
                      onClick={() => setExpandedCats(p => { const n = new Set(p); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}>
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

            {/* Completion CTA */}
            {allPacked && totalCount > 0 && (
              <div className="mt-4 text-center fade-in-up">
                <button className="cute-btn w-full flex items-center justify-center gap-2 text-sm" onClick={generatePoster}>
                  <Icon name="sparkles" size={15} /> 生成旅行纪念卡片
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Desktop Scene (right, large) ── */}
        <ScenePanel isMobile={false} />
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

      {/* ══════ Poster Modal ══════ */}
      {showPoster && (
        <div className="modal-overlay" onClick={() => { setShowPoster(false); setSuitcaseClosed(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex-1 overflow-y-auto p-4">
              {posterUrl ? <img src={posterUrl} alt="旅行卡片" className="w-full rounded-xl shadow-sm" /> : (
                <div className="flex items-center justify-center h-80 md:h-96">
                  <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--peach)' }} />
                </div>
              )}
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'var(--gray-light)' }}>
              <div className="flex gap-2">
                <button className="cute-btn-secondary cute-btn flex-1 flex items-center justify-center gap-2 text-sm" onClick={() => setShowPoster(false)}>
                  <Icon name="x" size={15} /> 关闭
                </button>
                {posterUrl && (
                  <button className="cute-btn flex-1 flex items-center justify-center gap-2 text-sm" onClick={downloadPoster}>
                    <Icon name="download" size={15} /> 保存图片
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Hidden Poster Template ══════ */}
      <div ref={posterRef} className="poster-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div className="poster-visual"
          style={{ backgroundImage: `url(${getDestImage(tripConfig.destination, tripConfig.purpose)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,251,242,0.2) 0%, rgba(255,251,242,0) 40%, rgba(255,251,242,0.3) 70%, rgba(255,251,242,1) 100%)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <img src="/cat-butler.png" alt="小猫管家" className="w-36 h-auto object-contain drop-shadow-xl" draggable={false} />
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
              {PURPOSES.find(p => p.value === tripConfig.purpose)?.label}
            </p>
            <h1 className="text-5xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', letterSpacing: '-0.02em' }}>{tripConfig.destination}</h1>
            <p className="text-base mt-1" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)' }}>{tripConfig.days} 天 · {totalCount} 件行李</p>
          </div>
        </div>
        {showListOnPoster && (
          <div className="poster-list">
            <h2 className="text-3xl font-bold text-center mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-dark)', letterSpacing: '-0.02em' }}>Packing List</h2>
            <p className="text-center text-sm mb-8" style={{ fontFamily: 'var(--font-body)', color: 'var(--gray-mid)' }}>{tripConfig.destination} - {tripConfig.days} Days</p>
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
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--peach)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="9" r="3"/><circle cx="17" cy="5" r="2"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="11" r="2"/><circle cx="3" cy="11" r="2"/><path d="m10 14 1 3 1-3"/>
                  </svg>
                </div>
                <span className="text-xs font-bold tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-mid)' }}>PURRPACK</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
