import type { ChecklistItem, Category, TripConfig, PackedSlot } from '@/types';
import { ITEM_IMAGES, DEST_IMAGES } from '@/constants';

/* Category-level image used when entire category is batch-packed */
export function getCategoryImage(categoryName: string): string {
  const n = categoryName.toLowerCase();
  if (n.includes('证件') || n.includes('财物')) return './item_bag_documents.png';
  if (n.includes('衣物') || n.includes('衣服') || n.includes('穿搭')) return './item_bag_clothes.png';
  if (n.includes('电子设备')) return './item_bag_electronics.png';
  if (n.includes('摄影')) return './item_bag_camera.png';
  if (n.includes('沙滩')) return './item_bag_camera.png';
  if (n.includes('户外')) return './item_bag_camera.png';
  if (n.includes('商务')) return './item_bag_documents.png';
  if (n.includes('洗护') || n.includes('健康')) return './item_toiletries.png';
  return './item_pouch.png';
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/* ═══════════════════════════════════════════════
   Helpers: Images
   ═══════════════════════════════════════════════ */
export function getDestImage(destination: string, purpose: string): string {
  const d = destination.toLowerCase();
  if (d.includes('paris') || d.includes('巴黎')) return DEST_IMAGES.paris;
  if (d.includes('tokyo') || d.includes('东京') || d.includes('京都') || d.includes('大阪')) return DEST_IMAGES.tokyo;
  if (d.includes('beach') || d.includes('海') || d.includes('岛')) return DEST_IMAGES.beach;
  if (purpose === 'hiking' || d.includes('mountain') || d.includes('山')) return DEST_IMAGES.mountain;
  return DEST_IMAGES.city;
}

export function getItemImage(itemName: string): string {
  const n = itemName.toLowerCase();

  /* ── 精准单个物品匹配 ── */
  if (n.includes('药品') || n.includes('药')) return './item_medicine.png';
  if (n.includes('电脑') || n.includes('笔记本')) return './item_laptop.png';
  if (n.includes('一次性内裤')) return './item_underwear_disposable.png';
  if (n.includes('内裤')) return './item_underwear_v2.png';
  if (n.includes('t恤')) return './item_tshirt.png';
  if (n.includes('吊带上衣')) return './item_camisole.png';
  if (n.includes('吊带')) return './item_camisole.png';
  if (n.includes('裙子') || n.includes('连衣裙')) return './item_dress_v2.png';
  if (n.includes('泳衣')) return './item_swimsuit_skirt.png';
  if (n.includes('厚外套')) return './item_jacket_thick.png';
  if (n.includes('轻便外套') || n.includes('户外外套')) return './item_jacket_v2.png';
  if (n.includes('衬衫')) return './item_shirt_v2.png';
  if (n.includes('袜子') || n.includes('袜')) return './item_socks_v2.png';
  if (n.includes('雨伞') || n.includes('伞')) return './item_umbrella.png';
  if (n.includes('户外登山鞋') || n.includes('登山鞋')) return './item_hiking_shoes.png';
  if (n.includes('户外鞋子') || n.includes('户外鞋')) return './item_hiking_shoes.png';
  if (n.includes('拖鞋') || n.includes('人字拖') || n.includes('夹脚拖')) return './item_flipflops.png';
  if (n.includes('鞋') || n.includes('拖')) return './item_shoes.png';
  if (n.includes('洗面奶')) return './item_facial_cleanser.png';
  if (n.includes('化妆品')) return './item_bag_cosmetics.png';
  if (n.includes('睡衣')) return './item_pajamas.png';
  if (n.includes('首饰') || n.includes('配饰') || n.includes('珠宝')) return './item_bag_jewelry.png';
  if (n.includes('登山杖')) return './item_trekking_pole.png';

  /* ── 护肤品 / 洗护合集 ── */
  if (n.includes('洗漱包') || n.includes('旅行套装') || n.includes('旅行装')) return './item_travel_set.png';
  if (n.includes('洗漱') || n.includes('洗护')) return './item_toiletries.png';
  if (n.includes('面霜') || n.includes('霜')) return './item_cream.png';
  if (n.includes('乳液') || n.includes('身体乳') || n.includes('护肤')) return './item_body_lotion.png';
  if (n.includes('防晒')) return './item_sunscreen.png';

  /* ── 帽子 ── */
  if (n.includes('棒球帽')) return './item_baseball_cap.png';
  if (n.includes('户外遮阳帽') || n.includes('户外帽')) return './item_sunhat_v2.png';
  if (n.includes('遮阳帽') || n.includes('沙滩帽')) return './item_sunhat.png';
  if (n.includes('帽')) return './item_hat.png';

  /* ── 证件与财物 ── */
  if (n.includes('护照')) return ITEM_IMAGES['item-passport'];
  if (n.includes('身份证') || n.includes('行程单')) return './item_idcard.png';
  if (n.includes('银行卡') || n.includes('钱包') || n.includes('名片')) return ITEM_IMAGES['item-wallet'];
  if (n.includes('现金')) return './item_cash.png';

  /* ── 衣物穿搭（兜底） ── */
  if (n.includes('背心')) return './item_camisole.png';
  if ((n.includes('衣') || n.includes('衫')) && !n.includes('雨衣') && !n.includes('内衣')) return ITEM_IMAGES['item-shirt'];
  if ((n.includes('裤') || n.includes('裙')) && !n.includes('内衣')) return ITEM_IMAGES['item-pants'];
  if (n.includes('内衣')) return './item_bag_underwear.png';
  if (n.includes('外套') || n.includes('夹克') || n.includes('雨衣') || n.includes('西装')) return ITEM_IMAGES['item-jacket'];
  if (n.includes('围巾')) return ITEM_IMAGES['item-scarf'];

  /* ── 洗护健康（兜底） ── */
  if (n.includes('洗') || n.includes('护') || n.includes('霜') || n.includes('液') || n.includes('防晒') || n.includes('卸妆') || n.includes('精华')) return ITEM_IMAGES['item-skincare'];
  if (n.includes('面膜')) return './item_mask.png';
  if (n.includes('能量')) return './item_snacks.png';

  /* ── 电子设备 & 摄影 ── */
  if (n.includes('相机')) return ITEM_IMAGES['item-camera'];
  if (n.includes('三脚架')) return ITEM_IMAGES['item-camera'];
  if (n.includes('充电') || n.includes('插头') || n.includes('转换') || n.includes('电池')) return ITEM_IMAGES['item-charger'];
  if (n.includes('头戴耳机')) return './item_headphones.png';
  if (n.includes('耳机')) return './item_earbuds.png';
  if (n.includes('电子') || n.includes('设备')) return ITEM_IMAGES['item-sunglasses'];
  if (n.includes('墨镜') || n.includes('眼镜') || n.includes('太阳镜')) return './item_sunglasses_v2.png';

  /* ── 鞋帽包 & 其他 ── */
  if (n.includes('收纳') || n.includes('袋') || n.includes('包') || n.includes('防水') || n.includes('手机袋')) return ITEM_IMAGES['item-pouch'];

  return './item_unknown.png';
}

/* ═══════════════════════════════════════════════
   Stacking Packing Algorithm
   Items stack by addition order (later = higher z-index)
   ═══════════════════════════════════════════════ */
export function calculateSlot(totalPacked: number): PackedSlot {
  // Split into left/right halves, leaving middle ~45-55 empty for zipper seam
  const isLeft = Math.random() < 0.5;
  const x = isLeft ? 12 + Math.random() * 28 : 60 + Math.random() * 28; // 12-40 or 60-88
  const y = 24 + Math.random() * 52; // 24-76 vertical range (tighter top/bottom margins)
  const rotate = [-4, -1, 2, 5][totalPacked % 4] + (Math.random() - 0.5) * 3;
  const scale = 0.95 + Math.random() * 0.15;

  return { x, y, rotate, order: totalPacked, scale, addedAt: Date.now() };
}

/* ═══════════════════════════════════════════════
   Destination Type Helper
   ═══════════════════════════════════════════════ */
export function getDestinationType(destination: string): 'domestic' | 'hongkong-macau' | 'taiwan' | 'international' {
  const d = destination.toLowerCase();
  if (d.includes('hong kong') || d.includes('香港') || d.includes('macau') || d.includes('macao') || d.includes('澳门')) {
    return 'hongkong-macau';
  }
  if (d.includes('taiwan') || d.includes('台湾')) {
    return 'taiwan';
  }
  const intlKeywords = [
    '日本', '泰国', '韩国', '新加坡', '马来西亚', '越南', '印尼', '菲律宾', '美国', '英国', '法国', '德国', '意大利', '西班牙', '瑞士', '荷兰', '比利时', '奥地利', '捷克', '匈牙利', '波兰', '俄罗斯', '土耳其', '希腊', '葡萄牙', '瑞典', '挪威', '丹麦', '芬兰', '冰岛', '爱尔兰', '加拿大', '墨西哥', '巴西', '阿根廷', '智利', '秘鲁', '澳大利亚', '新西兰', '斐济', '马尔代夫', '迪拜', '埃及', '南非', '摩洛哥', '肯尼亚',
    '东京', '大阪', '京都', '北海道', '冲绳', '福冈', '名古屋', '横滨', '札幌', '神户', '广岛', '仙台',
    '首尔', '釜山', '济州', '仁川', '大邱', '大田', '光州',
    '曼谷', '清迈', '芭提雅', '普吉', '甲米', '华欣', '苏梅',
    '新加坡', '吉隆坡', '槟城', '兰卡威', '马六甲',
    '巴厘岛', '雅加达', '日惹', '泗水', '乌布', '库塔',
    '河内', '胡志明', '岘港', '芽庄', '大叻', '富国岛',
    '马尼拉', '宿务', '长滩', '巴拉望', '薄荷岛', '杜马盖地',
    '金边', '暹粒', '西哈努克',
    '万象', '琅勃拉邦', '万荣',
    '仰光', '曼德勒', '蒲甘', '茵莱湖',
    '加德满都', '博卡拉', '奇特旺',
    '科伦坡', '康提', '加勒',
    '新德里', '孟买', '斋普尔', '果阿', '班加罗尔', '瓦拉纳西', '阿格拉', '乌代布尔', '焦特布尔',
    '迪拜', '阿布扎比',
    '伊斯坦布尔', '卡帕多奇亚', '安塔利亚',
    '开罗', '卢克索', '阿斯旺', '赫尔格达',
    '卡萨布兰卡', '马拉喀什', '菲斯', '舍夫沙万',
    '内罗毕', '蒙巴萨', '马赛马拉', '桑给巴尔', '乞力马扎罗',
    '开普敦', '约翰内斯堡', '德班',
    '巴黎', '尼斯', '里昂', '马赛', '戛纳', '波尔多',
    '伦敦', '爱丁堡', '曼彻斯特', '利物浦', '格拉斯哥',
    '柏林', '慕尼黑', '法兰克福', '汉堡', '科隆',
    '罗马', '米兰', '威尼斯', '佛罗伦萨', '那不勒斯',
    '马德里', '巴塞罗那', '塞维利亚', '格拉纳达',
    '阿姆斯特丹', '鹿特丹',
    '苏黎世', '日内瓦', '卢塞恩',
    '维也纳', '萨尔茨堡', '因斯布鲁克',
    '布拉格', '布达佩斯',
    '雅典', '圣托里尼', '米科诺斯',
    '里斯本', '波尔图',
    '雷克雅未克', '蓝湖',
    '斯德哥尔摩', '奥斯陆', '卑尔根', '特罗姆瑟', '哥本哈根', '赫尔辛基', '罗瓦涅米',
    '都柏林', '高威',
    '华沙', '克拉科夫',
    '莫斯科', '圣彼得堡',
    '里约', '圣保罗', '萨尔瓦多',
    '布宜诺斯艾利斯', '门多萨', '巴里洛切', '乌斯怀亚', '伊瓜苏',
    '圣地亚哥', '瓦尔帕莱索', '百内', '复活节岛',
    '利马', '库斯科', '马丘比丘',
    '波哥大', '麦德林', '卡塔赫纳',
    '基多', '瓜亚基尔', '加拉帕戈斯',
    '拉巴斯', '乌尤尼',
    '蒙得维的亚', '埃斯特角城',
    '亚松森',
    '加拉加斯', '玛格丽塔', '天使瀑布',
    '墨西哥城', '坎昆', '图卢姆',
    '哈瓦那', '巴拉德罗',
    '金斯敦', '蒙特哥贝',
    '拿骚', '天堂岛',
    '布里奇顿',
    '纽约', '洛杉矶', '旧金山', '芝加哥', '波士顿', '迈阿密', '西雅图', '拉斯维加斯', '华盛顿', '费城', '圣迭戈', '火奴鲁鲁', '亚特兰大', '丹佛', '底特律',
    '温哥华', '多伦多', '蒙特利尔', '卡尔加里',
    '悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德', '凯恩斯', '黄金海岸',
    '奥克兰', '惠灵顿', '基督城', '皇后镇', '罗托鲁瓦',
    '楠迪', '丹娜努', '玛玛努卡',
    '科罗尔', '水母湖',
    '塞班', '军舰岛',
    '帕皮提', '波拉波拉', '茉莉雅',
    '南极', '南极洲',
    '北极',
    '留尼汪', '马约特', '马提尼克', '瓜德罗普', '法属圭亚那',
    '英属维尔京', '美属维尔京', '安圭拉', '蒙特塞拉特',
    '安提瓜', '巴布达', '多米尼克', '圣卢西亚', '圣文森特', '格林纳丁斯', '格林纳达', '巴巴多斯', '特立尼达', '多巴哥',
    '阿鲁巴', '库拉索', '博奈尔',
    '福克兰', '南乔治亚',
    '朝鲜', '平壤', '板门店', '开城', '妙香山', '金刚山',
    '蒙古', '乌兰巴托', '戈壁',
    '文莱', '斯里巴加湾',
    '东帝汶', '帝力',
    '巴布亚新几内亚', '莫尔兹比港',
    '所罗门群岛', '霍尼亚拉',
    '瓦努阿图', '维拉港', '塔纳岛',
    '新喀里多尼亚', '努美阿',
    '萨摩亚', '阿皮亚',
    '汤加', '努库阿洛法',
    '基里巴斯', '瑙鲁', '图瓦卢',
    '密克罗尼西亚', '马绍尔群岛',
    '库克群岛', '纽埃', '托克劳', '皮特凯恩',
    '美属萨摩亚',
    '关岛', '天宁', '罗塔',
    '复活节岛', '加拉帕戈斯',
    '关岛', '北马里亚纳',
    '科索沃', '德涅斯特河沿岸', '阿布哈兹', '南奥塞梯', '纳戈尔诺-卡拉巴赫', '北塞浦路斯', '西撒哈拉', '巴勒斯坦', '索马里兰', '索马里',
    '吉布提', '厄立特里亚', '苏丹', '南苏丹', '乍得', '尼日尔', '马里', '布基纳法索', '毛里塔尼亚', '塞内加尔', '冈比亚', '几内亚比绍', '几内亚', '塞拉利昂', '利比里亚', '科特迪瓦', '加纳', '多哥', '贝宁', '尼日利亚',
    '喀麦隆', '中非', '赤道几内亚', '加蓬', '刚果', '刚果民主共和国', '圣多美和普林西比', '安哥拉', '赞比亚', '马拉维', '莫桑比克', '科摩罗', '塞舌尔', '毛里求斯'
  ];
  if (intlKeywords.some(k => d.includes(k))) return 'international';
  return 'domestic';
}

/* ═══════════════════════════════════════════════
   Smart Checklist Generator
   ═══════════════════════════════════════════════ */
export function generateChecklist(config: TripConfig): Category[] {
  const { days, purpose, destination } = config;
  const d = Math.max(1, Math.min(days, 30));
  const destType = getDestinationType(destination);

  const idDoc = destType === 'international' ? '护照'
              : destType === 'hongkong-macau' ? '港澳通行证'
              : destType === 'taiwan' ? '台湾通行证'
              : '身份证';

  const docItems: ChecklistItem[] = [{ id: uid(), text: idDoc, packed: false }];
  if (destType !== 'domestic') {
    docItems.push({ id: uid(), text: '银行卡', packed: false });
    docItems.push({ id: uid(), text: '现金', packed: false });
  }

  const baseCategories: Category[] = [
    {
      id: uid(), name: '证件与财物', icon: 'shield',
      items: docItems,
    },
    {
      id: uid(), name: '衣物穿搭', icon: 'shirt',
      items: [
        { id: uid(), text: '轻便外套', packed: false },
        { id: uid(), text: `轻便T恤 x${Math.min(d, 5)}`, packed: false },
        { id: uid(), text: d > 3 ? '长袖上衣' : '吊带', packed: false },
        { id: uid(), text: '舒适长裤', packed: false },
        { id: uid(), text: '裙子/连衣裙', packed: false },
        { id: uid(), text: '睡衣套装', packed: false },
        { id: uid(), text: '一次性内裤 x' + Math.min(d + 1, 7), packed: false },
        { id: uid(), text: '内衣 x' + Math.min(d + 1, 7), packed: false },
        { id: uid(), text: '袜子 x' + Math.min(d + 1, 7), packed: false },
        { id: uid(), text: purpose === 'hiking' ? '户外帽' : '帽子', packed: false },
        { id: uid(), text: '雨伞', packed: false },
      ],
    },
    {
      id: uid(), name: '洗护健康', icon: 'droplet',
      items: [
        { id: uid(), text: '旅行装洗面奶', packed: false },
        { id: uid(), text: '保湿乳液', packed: false },
        { id: uid(), text: '防晒霜', packed: false },
        { id: uid(), text: '卸妆水', packed: false },
        { id: uid(), text: '化妆品', packed: false },
        { id: uid(), text: '常用药品', packed: false },
      ],
    },
    {
      id: uid(), name: '电子设备', icon: 'smartphone',
      items: [
        { id: uid(), text: '充电宝', packed: false },
        { id: uid(), text: '耳机', packed: false },
        ...(destType !== 'domestic' ? [{ id: uid(), text: '转换插头', packed: false }] : []),
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
        { id: uid(), text: '拖鞋', packed: false },
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
