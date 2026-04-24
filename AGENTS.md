# AGENTS.md — 拾箱小猫 PackyCat（小猫行李收纳助手）

> 本文件供 AI 编程助手阅读。读者应被假定对该项目一无所知。

---

## 项目概述

**拾箱小猫 PackyCat**（产品名：PurrPack）是一款纯前端、单页面的 React 应用，帮助用户根据目的地、行程天数和旅行目的生成可视化的行李收纳清单。应用在左侧提供交互式清单，右侧（桌面端）或顶部（移动端）展示一只"小猫管家"躺在打开的行李箱内的场景；用户勾选物品时，对应的物品图标会实时堆叠进行李箱中，并伴随猫咪动画。

项目没有后端服务，所有数据通过 `localStorage` 持久化，打包产物为静态 HTML/CSS/JS，可直接部署到任何静态托管服务。

- **主要语言**：UI、注释、文案均以中文为主
- **应用入口**：`app/index.html`
- **源代码根目录**：`app/`
- **构建产物目录**：`app/dist/`（Vite 默认输出）
- **已部署的静态文件**：`deploy/`（仓库中保留的一份预构建版本，用于直接发布）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19.2 + TypeScript 5.9 |
| 构建工具 | Vite 7.2.4 |
| 样式 | Tailwind CSS 3.4.19 + PostCSS + Autoprefixer |
| UI 组件库 | shadcn/ui（New York 风格，40+ 组件已安装） |
| 图标 | Lucide React + 项目内嵌自定义 SVG（`Icon` 组件） |
| 路由 | `react-router` 已安装但**未使用**（单页应用） |
| 表单/校验 | `react-hook-form` + `zod`（shadcn 标配） |
| 截图/海报生成 | `html2canvas` 1.4.1 |
| 其他 | `clsx` / `tailwind-merge`（`cn` 工具函数）、`date-fns`、`recharts`、`sonner` 等 |

开发环境要求 **Node.js 20**。

---

## 项目结构

```
app/
├── index.html              # HTML 入口，引入 Google Fonts（Varela Round / Nunito / Caveat）
├── package.json            # npm 脚本与依赖
├── vite.config.ts          # Vite 配置：base='./'、端口 3000、@/src 别名
├── tsconfig.json           # 项目引用配置（引用 tsconfig.app.json + tsconfig.node.json）
├── tsconfig.app.json       # 应用 TS 配置：strict、noUnusedLocals、react-jsx
├── tailwind.config.js      # Tailwind 主题扩展（颜色、圆角、阴影、动画）
├── postcss.config.js       # PostCSS：tailwindcss + autoprefixer
├── eslint.config.js        # ESLint：@eslint/js + typescript-eslint + react-hooks + react-refresh
├── components.json         # shadcn/ui 配置（非 RSC、TSX、CSS 变量、别名映射）
├── src/
│   ├── main.tsx            # React 应用挂载点（createRoot）
│   ├── App.tsx             # 唯一核心业务组件（约 1300 行），包含全部状态与 UI
│   ├── App.css             # 少量组件级样式（当前几乎 unused）
│   ├── index.css           # 全局样式、CSS 变量、大量自定义动画 keyframes、组件类名
│   ├── pages/Home.tsx      # 遗留的 Vite 默认模板页面（当前未使用）
│   ├── lib/utils.ts        # `cn(...)` 工具函数（clsx + tailwind-merge）
│   ├── hooks/use-mobile.ts # `useIsMobile()` hook（768px 断点）
│   └── components/ui/      # shadcn/ui 组件（40+ 个：button、card、dialog、form、select 等）
├── public/                 # 静态资源：行李箱 PNG、物品 PNG、猫咪 PNG、目的地 JPG、logo 等
└── node_modules/

deploy/                     # 预构建的静态部署包（index.html + assets/）
App.tsx                     # 项目根目录下的旧版/备份 App.tsx（与 app/src/App.tsx 内容近似）
purrpack-v5-dist.zip        # 历史构建压缩包
```

> **注意**：绝大部分业务逻辑和 UI 都集中在 `app/src/App.tsx` 一个文件中。该文件定义了类型、常量、辅助函数、清单生成器、动画状态机以及完整的 JSX 渲染。修改功能时通常需要直接编辑此文件。

---

## 构建与运行命令

所有命令均在 `app/` 目录下执行：

```bash
cd app

# 安装依赖
npm install

# 开发服务器（端口 3000）
npm run dev

# 生产构建（tsc 类型检查 + vite build → 输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview

# 代码检查
npm run lint
```

### 部署方式

1. 执行 `npm run build` 生成 `app/dist/`。
2. `dist/` 内的文件可直接上传至任何静态托管服务（GitHub Pages、Vercel、Netlify、对象存储 CDN 等）。
3. 由于 `vite.config.ts` 中设置了 `base: './'`，构建产物使用相对路径，不依赖根域名。
4. 仓库中已有一份预构建版本位于 `deploy/`，可直接作为发布源。

---

## 代码组织与模块划分

### 核心类型（`app/src/App.tsx` 顶部）

- `ChecklistItem`：单个行李项 `{ id, text, packed }`
- `Category`：分类 `{ id, name, items, isBonus?, icon }`
- `TripConfig`：行程配置 `{ destination, days, purpose }`
- `TripHistory`：历史记录 `{ id, config, categories, createdAt }`
- `PackedSlot`：物品在行李箱内的视觉坐标 `{ x, y, rotate, order, scale, addedAt, image? }`
- `CatAction`：猫咪动画状态 `'idle' | 'reaching' | 'holding' | ...`

### 清单生成器 `generateChecklist(config)`

- 根据 `days`（上限 30 天）、`purpose`（城市/海边/徒步/商务/探亲）、`destination`（中文地名）智能生成默认清单。
- `getDestinationType(destination)` 通过关键词匹配判断目的地类型：`domestic` / `hongkong-macau` / `taiwan` / `international`，从而决定证件类物品（身份证 vs 护照 vs 港澳通行证等）。
- 基础分类：证件与财物、衣物穿搭、洗护健康、电子设备。
- 额外分类（`isBonus: true`）：根据 purpose 自动追加摄影器材、沙滩装备、户外装备或商务用品。

### 视觉与动画系统

- **行李箱尺寸**：根据天数分为小尺寸（≤5 天）和大尺寸（≥6 天），对应不同的 PNG 素材和像素级内衬边距常量 `SUITCASE_INSET`。
- **物品堆叠算法**：`calculateSlot(totalPacked)` 使用随机分布将物品放入行李箱左/右半区，避开中间拉链线。
- **物品图片映射**：`getItemImage(itemName)` 通过大量中文关键词匹配返回对应的 `/item_xxx.png` 路径。
- **CSS 动画**：`index.css` 中定义了 20+ 个 keyframes（`cat-jump`、`zipper-close`、`item-pop-in`、`float-particle` 等），并通过自定义类名（`.cat-idle`、`.packed-item-visual` 等）应用到元素。

### 状态管理

全部使用 React 原生 hooks，无外部状态库：

- `tripConfig`：当前行程输入
- `categories`：清单数据（嵌套数组）
- `expandedCats`：展开/收起分类的 Set
- `packedSlots`：已打包物品在行李箱内的视觉坐标映射
- `history`：历史记录（从 `localStorage` 初始化）
- `showCompletionModal` / `showPoster` / `showHistory`：模态框显隐
- `isEditing`：控制顶部输入区是编辑模式还是展示模式

### 持久化

- `purrpack-current`：localStorage key，保存当前未完成的行程和清单。
- `purrpack-history`：localStorage key，保存最近 20 条历史记录。

---

## 代码风格指南

- **语言**：代码注释、变量命名、UI 文案均以中文为主。新增功能时请保持中文 UI 文案。
- **类型安全**：TypeScript 开启 `strict: true`，且启用 `noUnusedLocals` 和 `noUnusedParameters`。未使用的变量会导致构建失败。
- **样式写法**：
  - 大量使用 Tailwind 工具类进行布局与间距控制。
  - 颜色、字体、动画等主题 token 通过 CSS 变量定义在 `index.css` 的 `:root` 中（如 `--cream: #FFFBF2`、`--peach: #F2D4C8`）。
  - 部分精细的视觉样式（如动态颜色、字体族）使用内联 `style={{ ... }}`。
  - 自定义组件类名（`.cute-input`、`.cute-btn`、`.category-card`、`.modal-overlay` 等）定义在 `index.css`。
- **shadcn/ui 组件**：如需新增 shadcn 组件，应遵循项目 `components.json` 的别名约定：`@/components/ui` 存放 UI 组件，`@/lib/utils` 存放工具函数。
- **单文件偏好**：当前业务逻辑高度集中在 `App.tsx`。如新增功能较小，可直接在该文件中追加；如功能较大，可考虑拆分到 `src/sections/` 或 `src/hooks/`（`info.md` 中建议的目录结构）。

---

## 测试策略

**当前项目中没有任何测试框架或测试文件。**

如果后续需要添加测试，建议按以下方向引入：

- **单元测试**：引入 `vitest` + `@testing-library/react`，对 `generateChecklist`、`getDestinationType`、`getItemImage`、`calculateSlot` 等纯函数进行测试。
- **组件测试**：对 `App.tsx` 中的交互逻辑（勾选物品、展开分类、添加/删除项）使用 React Testing Library 测试。
- **视觉回归**：对 `html2canvas` 生成的海报/完成卡片做快照测试。

目前验证功能的主要方式：

1. `npm run lint` — 保证无 ESLint 错误。
2. `npm run build` — 保证 TypeScript 类型检查通过且 Vite 构建成功。
3. `npm run dev` 后在浏览器中手动测试交互与动画。

---

## 安全与注意事项

- **无后端 / 无 API 密钥**：应用不调用任何外部 API，所有逻辑在前端完成。
- **html2canvas 限制**：海报与完成卡片通过 `html2canvas` 将 DOM 转为图片。生成时依赖 `useCORS: true`，但所有图片素材均为同域静态资源（`public/` 目录），无跨域问题。
- **localStorage 容量**：历史记录最多保留 20 条，清单数据量较小，不会触及存储上限。
- **XSS 风险较低**：用户输入仅用于展示和 `html2canvas` 截图，不插入到 HTML 字符串中；React 默认会对文本内容进行转义。
- **静态部署注意**：`deploy/` 目录中的文件是预构建产物，修改源码后如要更新线上版本，必须重新执行 `npm run build` 并同步 `dist/` 内容到 `deploy/`（或部署到对应托管服务）。

---

## 关键文件速查

| 文件 | 说明 |
|------|------|
| `app/src/App.tsx` | 核心业务逻辑 + UI（~1300 行） |
| `app/src/index.css` | 全局 CSS 变量、动画、自定义组件样式 |
| `app/src/main.tsx` | React 挂载入口 |
| `app/vite.config.ts` | Vite 配置（base='./'、@ 别名） |
| `app/tailwind.config.js` | Tailwind 主题配置 |
| `app/components.json` | shadcn/ui 项目配置 |
| `app/public/` | 全部静态图片素材（行李箱、物品、猫咪、背景） |
| `deploy/index.html` | 预构建的静态入口（生产部署用） |
