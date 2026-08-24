<p align="center">
  <a href="https://dshfind.com/zh/plugins/huanlinoto/dsh-plugin-anti-ads"><img src="https://dshfind.com/api/card/huanlinoto/dsh-plugin-anti-ads?lang=zh" alt="dsh-plugin-anti-ads card"></a>
</p>

# dsh-anti-ads

[![npm version](https://img.shields.io/npm/v/@huanlin/dsh-plugin-anti-ads)](https://www.npmjs.com/package/@huanlin/dsh-plugin-anti-ads)

给 DSH Web UI 安装的广告拦截器——拦截对象只有 [dsh-ads](https://github.com/dsh-external/dsh-ads) 一个。右下角一枚小徽章，广告没了，徽章记着拦掉了几个弹层。

## 它是怎么拦的

四层防御，独立工作、可单独开关：

| 层 | 机制 | 关什么 |
|----|------|--------|
| L1 设置写穿 | 通过 dsh-ads 自身的存储契约（`localStorage['dsh-ads:settings']` + `dsh-ads:persist-changed` 事件）把所有广告位开关写成关闭，并监听 dsh-ads 的广播持续压制 | 两侧广告栏、对话内信息流、右下角弹窗、跑分、安全告警、贪玩蓝鲸海报 |
| L2 兜底清理 | `MutationObserver` 监听页面变化，按形状（`position:fixed` + dsh-ads 的 z-index 区间，或全屏穿透遮罩层）识别并移除漏网弹层 | dsh-ads 未来版本绕过设置新增的广告位、改版后的根浮层 |
| L3 屏蔽动态广告源 | 对 `/dsh-ads/registry.json` 的请求（含带 query 的变体）直接返回空列表 | 社区插件的自动横幅 |
| L4 深层拦截 | 广播 dsh-ads 自身的 `dsh-ads:retired` 事件——它的「关闭所有广告」是模块级一次性开关，广告层在渲染前就检查这个标志，广播后整层隐藏到刷新 | 无视自身设置开关、任何新加广告位的 dsh-ads 版本 |

四层都不依赖对方：L1 失效时 L2/L3/L4 还在；关掉 L4，L1/L2/L3 照常跑。

**持久化**：拦截状态默认开启，跨刷新持续生效。「启用拦截」开关在设置页和徽章面板里；关掉它等于「恢复广告」——会同时把 dsh-ads 的设置恢复为默认。注意：L4 广播的「本次关闭」是 dsh-ads 刻意做成不可撤销的，若已广播过，广告层要刷新页面才会回来。

**一个已知边界**：dsh-ads 的持久化层有内存镜像，用户若在 dsh-ads 自己的设置页手动打开过某个广告位，L1 要到下次刷新才重新生效；期间由 L2 兜底清理浮层，L4 的广播也能把整个层压下去，对话内信息流广告（无 DOM 特征，只能靠 L1）可能短暂可见。

## 安装

构建产物随仓库分发（`lib/` 已提交），无 install、无 build、无运行时依赖：

```sh
# 从 npm 安装（推荐）：
dsh plugin --profile web add @huanlin/dsh-plugin-anti-ads

# 从本地 clone 开发安装：
dsh plugin --profile web add link:/path/to/dsh-anti-ads
# 重启 dsh web，刷新页面
```

配置行由 bundle patch 自动插入，无需手动编辑 cordis.patch.yml。

先装 [dsh-ads](https://github.com/dsh-external/dsh-ads) 才有东西可拦。装了之后：右下角出现「🛡 广告已拦截」徽章，点击可查看/修改拦截设置。dsh-ads 未安装时本插件无任何效果（徽章不出现）。

## 开发

```sh
pnpm install          # devDeps 用 link: 指向本机 ~/.dsh/source/current
pnpm run typecheck    # 类型门禁（tsconfig.json + tsconfig.client.json）
pnpm test             # vitest 全量（3 个 spec，54 个用例）
pnpm run build        # tsdown 双 bundle：lib/index.js（node stub）+ lib/client.js（浏览器半）
```

每次改动源码后跑 `pnpm run check`（typecheck + test + build 三件套）。

### 结构

```
src/
├── index.ts              # node 半：stub，仅占 main 位置
└── client/
    ├── index.tsx         # apply：注册 conversation.input.dock（order 100，晚于 dsh-ads 的 90）+ settings.section
    ├── AntiAdLayer.tsx   # 四层防御组装 + 徽章/面板 UI；关闭主开关时恢复 dsh-ads 默认
    ├── AntiAdsSection.tsx# 设置页（设置对话框里）
    ├── settings.ts       # 写穿协议：dsh-ads:settings key、persist-changed 事件、retired 事件、ADS_ALL_OFF、useAdsGuard
    ├── persist.ts        # 本插件自己的持久化（dsh-anti-ads: 前缀，独立事件总线）
    └── scrub.ts          # L2：根 portal / 独立弹层 / 全屏遮罩的形状匹配 + 清理
```

## 检查

```sh
pnpm run check     # typecheck + test + build
```

测试覆盖：

- `tests/scrub.spec.ts` — 形状匹配的每个分支（根 portal、独立弹层、全屏遮罩、z-index 边界、防误伤自己）、清理计数
- `tests/settings.spec.ts` — 写穿协议（key / 事件名 / detail 与 dsh-ads 源码一致）、retired 广播协议、防死循环、guard 反向压制、恢复默认
- `tests/client.spec.tsx` — 真实挂载后的四层行为：写穿生效、Observer 移除伪造 portal、registry fetch 短路（含 query 变体）、非广告请求透传、retire 广播与再广播、deep 开关门控、标记防误伤、关闭主开关恢复默认

## 免责

只和 dsh-ads 这一个插件的客户端交互：读它的存储 key、发它自己的「本次关闭」事件、清它的 DOM、截它的请求，不修改任何 DSH 源码，不触碰 dsh-ads 的仓库文件。dsh-ads 更新后若形状/协议变化，L2/L3 可能失效——那正是 L4 和 L1 要兜底的事。
