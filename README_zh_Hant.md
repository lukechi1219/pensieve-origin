# Pensieve

**你的第二大腦 - 基於 CODE 方法論的知識管理系統**

<div align="center">

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)

[English](README.md) | [繁體中文](README_zh_Hant.md)

</div>

---

## 什麼是 Pensieve?

Pensieve 是一個實作 Tiago Forte **CODE 方法論**（Capture、Organize、Distill、Express）的**第二大腦知識管理系統**。它透過系統化的知識處理流程,將你從被動消費者轉變為主動創造者。

靈感來自哈利波特中的儲思盆(Pensieve),這個魔法裝置可以儲存和回顧記憶。Pensieve 幫助你建立一個**外部認知系統**,解放你的大腦,放大你的創造潛能。

### 核心哲學

> 第二大腦不是「完美的檔案櫃」,而是「創意的發射台」。

從不完美的擷取開始。機會性地精煉。持續不斷地創造。

---

## CODE 方法論

CODE 代表將資訊轉化為創造性產出的四個順序步驟:

### 1. **Capture** (擷取) - 策展思維

**核心原則**: 不是「收集一切」,而是「策展共鳴」。

**四個擷取標準**:
- ✨ **啟發性** (Inspiring): 是否激發新想法?
- 🛠️ **實用性** (Useful): 未來能否應用?
- ❤️ **個人化** (Personal): 是否與我的經驗共鳴?
- 💡 **驚訝性** (Surprising): 是否挑戰既有認知?

**實踐方法**:
- 使用單一數位筆記工具集中保存
- 快速捕捉,暫不分類
- 記錄來源與脈絡

**常見錯誤**:
- 資訊分散在多處 (手機備忘錄、電腦筆記、書籤、截圖...)
- 想記住一切,最後什麼都記不住

### 2. **Organize** (組織) - 以行動為中心

**PARA 方法**:
- 🎯 **Projects** (專案): 2-3 個月內完成的短期目標
- 🌱 **Areas** (領域): 持續關注的生活領域 (健康、財務、人際關係、職涯...)
- 📚 **Resources** (資源): 未來可能有用的主題知識
- 📦 **Archive** (封存): 非活躍或已完成的專案

**核心提問**: 「這則筆記會用在哪個專案?」(而非「這屬於什麼類別?」)

**實踐方法**:
- 以行動導向組織,而非學術分類
- 避免過度複雜的階層結構
- 不必一次整理所有舊筆記 (機會性組織)

**常見錯誤**:
- 建立完美的分類系統,卻從不使用
- 花太多時間整理,忽略實際產出

### 3. **Distill** (精煉) - 為未來的自己設計

**漸進式摘要法** (4 層次):
1. **第 0 層**: 原始內容
2. **第 1 層**: 摘錄關鍵段落
3. **第 2 層**: 粗體標記重要句子
4. **第 3 層**: 執行摘要 (JARVIS 可以生成)
5. **第 4 層**: 用自己的話重新詮釋

**實踐方法**:
- **機會性精煉**: 每次接觸筆記時增加一點價值
- 不在前期投入過多精力於完美結構化
- 隨時間累積,筆記自然變得更精煉

**核心理念**:
> 為未來的自己設計筆記,減少認知負荷

**常見錯誤**:
- 一開始就想做完美摘要
- 過度精簡,失去原始脈絡

### 4. **Express** (表達) - 知識的價值在於使用

**核心原則**:
- 知識只有在**創造產出**時才有價值
- 不要等待完美才開始

**中間產物** (Intermediate Packets):
- 將專案分解為可重複使用的組件
- 例如: 5 個要點 → 簡報 → 文章 → 課程

**實踐方法**:
- 發佈簡單版本,持續迭代
- 建立「作品集」而非「筆記本」
- 分享與教學是最好的學習

**常見錯誤**:
- 完美主義陷阱 (「等我準備好再說」)
- 只輸入不輸出,筆記成為墓園

---

## 功能特色

### 已實作 ✅

- **儀表板**: 總覽統計卡片 (收件匣、專案、日記連勝)
- **PARA 組織**: 瀏覽專案、領域、資源、封存
- **筆記管理**: 建立、編輯、標籤、追蹤精煉層級
- **日記系統**: 每日條目含習慣追蹤與連勝計算
- **專案管理**: 追蹤活躍專案的里程碑與進度
- **JARVIS 語音助理**: AI 驅動的摘要功能,帶有機智英式管家個性
- **國際化**: 完整雙語支援 (English / 繁體中文)
- **Web UI**: 現代化 React 介面,即時更新
- **REST API**: 20+ 個端點供程式化存取

### 即將推出 🚧

- CLI 命令用於快速擷取與批次操作
- 語音擷取 (語音轉文字)
- 進階搜尋與篩選
- 分析與洞察儀表板
- 匯出至多種格式
- 行動裝置應用程式

---

## 快速開始

### 先決條件

- macOS (已於 macOS Sequoia 24.4.0 測試)
- [Node.js 18+](https://nodejs.org/)
- [Homebrew](https://brew.sh/)
- Google 帳號 (用於文字轉語音)

### 一鍵安裝

```bash
./init.sh
```

這個自動化腳本將會:
1. ✅ 檢查先決條件
2. ☁️ 安裝 Google Cloud SDK
3. 📦 設定後端相依套件
4. 🎨 設定前端相依套件

**所需時間**: 約 5-10 分鐘

### 啟動伺服器

**終端機 1 - 後端 API:**
```bash
cd _system
npm run serve
```

**終端機 2 - 前端:**
```bash
cd web-ui
npm run dev
```

**開啟**: http://localhost:5173/

---

## 專案結構

```
pensieve-origin/
├── vault/                      # 你的知識庫
│   ├── 0-inbox/               # 未整理的擷取 (從這裡開始)
│   ├── 1-projects/            # 活躍專案 (2-3 個月)
│   ├── 2-areas/               # 生活領域 (持續進行)
│   ├── 3-resources/           # 主題式參考資料
│   ├── 4-archive/             # 已完成專案
│   ├── journal/               # 每日日記條目
│   └── templates/             # 筆記範本
├── _system/                    # 後端 (Node.js + TypeScript)
│   ├── src/core/              # 業務邏輯
│   ├── src/web/               # Express REST API
│   └── script/                # 實用腳本
├── web-ui/                     # 前端 (React + Vite)
│   ├── src/api/               # API 客戶端
│   ├── src/components/        # React 元件
│   └── src/pages/             # 頁面元件
└── .claude/agents/             # JARVIS 語音助理
```

---

## PARA 方法實踐

### 專案 (1-projects/)
**定義**: 有期限的短期目標 (2-3 個月)

**範例**: `1-projects/project-second-brain/`

**特徵**:
- 有明確的結束日期
- 有具體的交付成果
- 需要主動關注

### 領域 (2-areas/)
**定義**: 無期限的長期責任

**範例**: `2-areas/health/`、`2-areas/career/`、`2-areas/relationships/`

**特徵**:
- 持續維護
- 需維持的標準
- 永遠不會「完成」

### 資源 (3-resources/)
**定義**: 感興趣的主題,用於參考

**範例**: `3-resources/programming/`、`3-resources/productivity/`

**特徵**:
- 非立即可行動的
- 未來可能有用
- 參考資料

### 封存 (4-archive/)
**定義**: 已完成或非活躍的專案

**範例**: `4-archive/2025-11-project-second-brain/`

**特徵**:
- 不再活躍
- 保存供參考
- 加上日期戳記以保留脈絡

---

## JARVIS 語音助理

### 英文 JARVIS
```bash
# 在 Claude Code CLI 中輸入:
Hey JARVIS

# JARVIS 以機智的英式管家個性回應
# 範例: "At your service, sir. What shall we tackle today?"

# 停用:
Goodbye JARVIS
```

### 中文 JARVIS (老賈)
```bash
# 在 Claude Code CLI 中輸入:
老賈

# JARVIS 以幽默的中文回應
# 範例: "老闆,有什麼需要我效勞的嗎?"

# 停用:
再見老賈
```

### 語音討論模式
```bash
# 在 Claude Code CLI 中輸入:
voice discussion

# 完整對話式回應,含 TTS 播放

# 停用:
cancel voice discussion
```

---

## 文件

- **[QUICKSTART.md](QUICKSTART.md)** - 詳細安裝與設定指南
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - 完整技術規格
- **[CLAUDE.md](CLAUDE.md)** - 開發者指南與專案參考
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - REST API 參考
- **[CLI_USER_MANUAL.md](CLI_USER_MANUAL.md)** - CLI 命令指南
- **[PROGRESS.md](PROGRESS.md)** - 目前實作狀態

---

## 技術堆疊

**後端:**
- Node.js 18+ 搭配 TypeScript 5.3
- Express.js REST API
- 檔案式儲存 (Markdown + YAML)

**前端:**
- React 18 + TypeScript
- Vite 7.2 (快速 HMR)
- Tailwind CSS v4
- React Router v6

**語音與 AI:**
- Google Cloud Text-to-Speech API
- Claude Code CLI agents

---

## 整體哲學

### 從消費者到創造者的轉變

建立**外部認知系統**以:
- 解放大腦,不必記住一切
- 減少心理負荷
- 專注於創造性工作
- 隨時間累積知識**複利效應**

### 關鍵洞察

1. **行動性優於分類**: 以「我會在哪個專案用到這個?」組織,而非學術分類
2. **機會性精煉**: 不要預先完美化筆記;每次接觸時增加價值
3. **中間產物**: 將工作分解為可重複使用的組件
4. **不完美的行動**: 從簡單開始,持續迭代
5. **產出導向**: 第二大腦是用來創造的,而非只是儲存

---

## 成本考量

**Google Cloud Text-to-Speech API 定價** (2025):
- 每月前 100 萬字元: **免費**
- 標準語音: 每 100 萬字元 $4 美元
- WaveNet 語音: 每 100 萬字元 $16 美元

**典型使用量**:
- 平均筆記摘要: 約 200 字元
- 每月 5,000 則摘要 = 100 萬字元 (在免費額度內)

Pensieve 使用**標準語音**以最大化免費額度使用。

---

## 貢獻

歡迎貢獻! 請確保:

1. 所有程式碼遵循 AGPL-3.0 授權條款
2. 新相依套件與 AGPL-3.0 相容
3. TypeScript 型別定義正確
4. 新功能包含測試
5. 文件已更新

詳見 [CLAUDE.md](CLAUDE.md) 開發者指南。

---

## 授權

本專案採用 **GNU Affero General Public License v3.0 (AGPL-3.0)** 授權。

**重點**:
- ✅ 可自由使用、修改、散布
- ✅ 必須與使用者分享原始碼
- ✅ **網路著作傳播權**: 若您將修改版本作為網路服務運行,必須向使用者提供原始碼
- ❌ 不得建立專有/閉源版本

詳見 [LICENSE](LICENSE) 完整內容。

更多資訊: <https://www.gnu.org/licenses/agpl-3.0.html>

---

## 資源

- [Building a Second Brain by Tiago Forte](https://www.buildingasecondbrain.com/)
- [PARA Method Overview](https://fortelabs.com/blog/para/)
- [Progressive Summarization](https://fortelabs.com/blog/progressive-summarization-a-practical-technique-for-designing-discoverable-notes/)
- [Building a Second Brain: Definitive Guide](https://fortelabs.com/blog/basboverview/)

---

## 致謝

本專案實作 **Tiago Forte** 開發的方法論以及他在 Building a Second Brain 的研究成果。

特別感謝開源社群提供的優秀工具,使本專案得以實現。

---

**哲學**: 第二大腦不是「完美的檔案櫃」,而是「創意的發射台」。

從不完美的擷取開始。機會性地精煉。持續不斷地創造。

**歡迎開始你的 Pensieve 之旅!** 🧠✨
