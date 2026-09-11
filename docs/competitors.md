# 竞争对手档案 · DSH 插件导航赛道（2026-08-17）

> 白刃战情报底稿。数字随生态暴涨，引用前必须实时核实（gh api 复查）。

## 一、导航/目录站赛道（直接对手）

### 1. dshhub.org — 中文社区插件站（实时扫描）
- 定位：发现/筛选/安装 DSH 社区插件
- 弱点：**无 sitemap**（实测 HTTP 000）、SEO 基建烂
- 威胁：中。Bing 已占位"dsh hub"词，但基建差，我们靠 sitemap/hreflang/Schema 全套压它

### 2. hub.omdsh.dev — DSH Hub Workshop（官方系）
- 定位：社区工作坊，从 dsh-plugin topic 核验插件
- 威胁：中高。官方背景 + Bing 已占位，但偏"工作坊/核验"定位，与"精选导航+整活"差异化

### 3. dsh.lanshuagent.com — 对手 B（反应最快）
- 定位：纯中文插件导航，203 个插件
- **关键情报**：SSL 证书 2026-08-14 05:33 UTC 签发——DSH 发布（08-13）第二天就上线，一直盯着生态
- 域名策略：二级域名挂主域 lanshuagent.com（主域仅 4.6KB 空壳），与我们子域名过渡打法一致
- 弱点：纯中文、无社区关系网、数据少于我们；被主域绑住，独立品牌迁移更麻烦
- 我们的优势：SEO 矩阵 + 双语 + 作者关系网 + meme 差异化

### 4. brown-tiger-44338.viewhtml.app — DSH 插件生态图谱
- 定位：单页静态生态总览（React/Next），数据源 topic:dsh-plugin，约 295 仓库分类展示
- 强项：数据广（295 vs 我们 101），"图谱"形态独特、适合传播
- 弱点：**viewhtml.app 预览托管域（无正式域名）**、无 Schema、无 canonical/hreflang、无详情页、纯中文、meta description 为空
- 判断：演示性质作品，非认真 SEO 对手；Google 不会给预览托管域权重
- **可抄**：分类图谱视角（一张图看全生态+分类计数）→ 可做 /ecosystem 生态全景页

## 二、垂类市场（互补，非正面冲突）

### 5. dsh-skin-market（kingOfSoySauce，★7）
- 皮肤垂类安装器 + registry（schema 校验 + 固定 SHA 安装 + Agent 提示词投稿）
- 关系：垂类互补。我们 /plugins/skins 是导航，它是安装器，可互为友链
- 学习点：每日 cron 自动抓取 + 投稿提示词模板机制

### 6. petdex（crafter-station，★3874）
- 桌宠垂类画廊/应用商店（Codex/Claude Code/DSH 跨平台），`npx petdex install`
- 关系：我们 /plugins/pets 是导航，它是商店；它本身也是我们收录的插件（win-win）

## 三、内容型清单（流量参照物）

### 7. awesome-dsh-plugin（★7469，每日更新）
- GitHub 清单 + awesome-dsh-plugin.com，大而全
- 关系：它是"清单"，我们是"精选导航+整活+评测"。无详情页深度、无 meme、无多图画廊、无多语种
- 注意：搜索"awesome dsh plugin"会被它截流，我们已在 TDK 覆盖该词

## 四、潜在重量级对手（盯住）

### 8. open-design（nexu-io，★88188）
- "Best DeepSeek Harness Design Plugin"，设计插件赛道头部
- 目前单一插件，若转导航/目录是重量级威胁，持续监控

### 9. 暴涨竞品（对比页素材）
- reasonix = esengine/DeepSeek-Reasonix ★34644（Trends +68550%）
- pi agent = can1357/oh-my-pi ★25290（Trends +111300%）

## 五、我们的护城河（对手都没有）
1. meme 整活分区（娱乐传播属性）
2. 单品详情页深度（评分 Schema + 多图画廊）
3. 多语种 hreflang（4 语种）
4. /compare 对比评测（决策词）
5. 每日自动化（截图刷新 + 新插件提名）
6. 完整 SEO 基建（sitemap/canonical/hreflang/Schema 全套，629 页预渲染）

## 六、窗口期判断
生态一天一个样（topic:dsh-plugin 一天 +141 仓库），导航站赛道暂无基建完备的头部——**窗口期就是现在**。
内容量（101 收录）尚追不上 awesome 清单广度 → 66 个候选插件审核收录是拉开差距的关键动作。

### 10. dsh-plugin.market（0326/dsh-plugin-market）— 可信注册站定位
- 定位：Trusted/Verified Plugin Registry（区别于发现型导航）——Format Verification / Compatibility / Security Scan / Maintenance / Publisher Trust 五维 Trust Profile，扫描结果绑定 commit SHA（dsh plugin add github:owner/repo#sha 可追溯安装）
- 技术：Cloudflare Workers + React 19 + Hono + D1，GitHub Actions 部署
- 生命周期：Candidate → Detected → Format Verified → Featured
- 数据（2026-08-18）：★3、forks 0、2026-08-16 创建——极早期
- 威胁评估：**当前 SEO 威胁为零**（站点 3.4KB 纯 JS 壳，body 可见文本 39 字符，无 SSR 无内容——Google 读不到任何东西）
- 定位差异：他们做"信任层"（verify/security），我们做"发现层"（导航/精选/meme/多语种 SEO）。同 awesome-dsh-plugin 的 manifest 校验、hub.omdsh.dev 的核验定位更接近，与我们正面冲突面小
- 值得记的点：commit SHA 绑定扫描结果的思路（安装代码与展示结果一一对应）是真创新，若生态爆发安全焦虑可借鉴
- 监控：若他们加 SSR/静态化内容 或 star 破百，重新评估

### 11. dsh.market（2BingLing/dsh-market）— 头号劲敌（2026-09-11 实测）
- **威胁等级：高**。必应"dsh 插件市场/DSH Market"类词第一（用户实测），收录 **6358** 插件（vs 我们 2771），数据每日 06:00 GitHub Actions 管道刷新
- 仓库：github.com/2BingLing/dsh-market（MIT，105★），GitHub Pages + Cloudflare，**数据公开在 dsh.market/plugins.json**（含现成中文描述 descriptionZh、安装命令、五维评分）
- 数据来源：5 个 topic（dsh-plugin/dsh/deepseek-harness-plugin/dsh-bundle/dsh-skill）多路排序并集 + 2 个 awesome 清单 + dsh-external 组织 + issue 投稿；特征检测（SKILL.md/skills//cordis 标记/package.json cordis 依赖），无 stars 门槛
- **五维评分体系（我们要抄的方法论）**：维护活跃30%（近90天提交+release+issue 健康度 Wilson）/ 实用度25%（README 结构完备度）/ 生态热度20%（stars 对数归一化 p99 动态基准 + fork Wilson）/ 便捷度15%（安装命令明确+无需密钥）/ 信号质量10%（description/license/topics/homepage/README 完备度）→ **加权几何平均**成 0-100 实用分（惩罚偏科），贝叶斯置信降权新插件，每条附一句话推荐理由；分档 90+ 全能/70-89 优秀/50-69 良好/<50 待观察
- 交互亮点：功能标签筛选（效率提升 3124/零配置 1807 等 12 热门）、类型/实用分/配置(开箱即用/需配置)/规模(<10★/10-50★/50+★)多维筛选、四个快捷 Tab（全部/高分精选/新手友好/最新上架）、WEEKLY PICK 本周精选、收藏（localStorage）、整合包（packs.json）、"帮我推荐"按钮
- **弱点（我们的打法）**：纯 CSR SPA——无 SSR、无 sitemap（对引擎隐身的 hash 路由内容）、纯中文单语、无 meme/整活、无 hreflang、无独立插件详情页路由（对比/评测缺失）。我们 SSR 预渲染 + 四语 + 全套 Schema 是正面对撞的胜负手
- **差距实锤**（2026-09-11 diff）：我们缺约 3600 条，其中头部缺 ruflo(71973★)/loopx(5779★)/Vibe-Skills(3238★)/OpenBitFun(2119★)/vox-director(1847★)/last30days-skill-cn(1770★)/DSH-Desktop-EAC(1621★)；≥50★ 段我们已有 1503/1595（头部覆盖不弱，缺的是尖货+长尾）
- 应对：scripts/import-dshmarket.mjs 全量分批镜像收录（批1 ≥50★ 92 条已入）；评分体系对标复刻（scripts/compute-scores.mjs，五维同权重几何平均）；作者榜差异化（他没有作者维度）
- 监控：每日 CI 顺带可 diff 其 plugins.json 增量；若其上线 SSR/sitemap 或英文版，升级应对
