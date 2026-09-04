# PBRRender 🎨

**PBR（基于物理）3D 模型预览插件 for DeepSeek Harness**
**A Physically-Based Rendering 3D model preview plugin for DeepSeek Harness**

渲染 GLB/GLTF 游戏美术资源，带贴图纹理、环境光照、轨道控制、材质通道检查，直接在模型回答里交互预览。
Render GLB/GLTF game-art assets inside chat with PBR textures, environment lighting, orbit controls, and material-channel inspection — fully interactive.

> 🔌 生态 / Ecosystem：仓库已挂 `#dsh` · `#dsh-plugin` · `#pbr` · `#gltf` topic，欢迎社区收录。
> The repo carries the `#dsh` · `#dsh-plugin` · `#pbr` · `#gltf` topics — community welcome.

---

## 🖼️ 效果展示 / Showcase

同一模型的材质通道检查（点击模式栏实时切换，以下为各模式渲染截图）。
Material-channel inspection of the same model (switch live via the mode bar; screenshots of each mode below).

| PBR（完整物理渲染 / Full PBR） | 基础色 / Base Color | 法线 / Normal |
|---|---|---|
| ![pbr](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-pbr.png) | ![basecolor](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-basecolor.png) | ![normal](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-normal.png) |

| 粗糙度（灰度）/ Roughness | 金属度（灰度）/ Metallic | AO（灰度）/ Ambient Occlusion |
|---|---|---|
| ![roughness](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-roughness.png) | ![metallic](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-metallic.png) | ![ao](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-ao.png) |

| 自发光 / Emissive | 线框 / Wireframe |
|---|---|
| ![emissive](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-emissive.png) | ![wireframe](https://raw.githubusercontent.com/dhb861832993-star/pbr-render/8931eb36d84015cfc39e34e8bab126fdbdbdd6f5/assets/mode-wireframe.png) |

> 标量通道（粗糙度/金属度/AO）按 PBR 规范以**灰度**显示——正是游戏引擎（Unity/UE）读取的原始贴图通道数据。
> Scalar channels (roughness/metallic/AO) are shown in **grayscale** per PBR convention — the raw texture-channel data game engines (Unity/UE) actually read.

---

## ✨ 特性 / Features

**PBR 渲染 / PBR Rendering**
- 金属/粗糙度/法线/自发光/AO 贴图自动加载（GLB 内嵌或 GLTF 兄弟文件）
- Metalness / roughness / normal / emissive / AO maps load automatically (embedded in GLB or as GLTF sibling files)

**材质通道检查 / Material-Channel Inspection**
- viewer 顶部模式栏一键切换 —— PBR / 基础色 / 法线 / 粗糙度 / 金属度 / AO / 自发光 / 线框
- One-click mode bar at the top of the viewer — PBR / base color / normal / roughness / metallic / AO / emissive / wireframe

**真实 HDR 环境光 / Real HDR Environment Lighting**
- 内置 5 种 CC0 HDR 环境图（Poly Haven 1K）—— `studio` 棚拍 / `sunset` 黄昏 / `outdoor` 户外 / `sunrise` 日出 / `night` 夜晚，`env` 字段切换，`envBackground` 可显示为背景；未指定时回退程序化 RoomEnvironment。**viewer 顶部有"环境"切换栏，预览时可直接点击换环境**
- 5 built-in CC0 HDR environments (Poly Haven 1K) — `studio` / `sunset` / `outdoor` / `sunrise` / `night`, switched via the `env` field, or shown as the background with `envBackground`; falls back to a procedural RoomEnvironment when unset. **An on-viewer "environment" bar lets you swap environments live**

**交互 / Interaction**
- 拖拽旋转、滚轮缩放、自动旋转、曝光调节、**一键全屏**（右上角 ⛶ 按钮，Fullscreen API + 移动端覆盖层降级）
- Orbit by dragging, zoom with the wheel, auto-rotate, exposure control, and **one-click fullscreen** (⛶ button, Fullscreen API with mobile overlay fallback)

**主动触发 / Active Triggering**
- 模型发现 3D 模型文件（API 生成/下载/工作区出现）时自动调用 `pbr_render` 工具并渲染预览，无需用户提示
- Automatically calls the `pbr_render` tool and renders a preview when a 3D model file appears (API-generated / downloaded / dropped into the workspace) — no user prompt needed

**安全 / Security**
- 文件服务工作区限定 + 扩展名白名单 + 512 MiB 上限
- Workspace-scoped file serving + extension whitelist + 512 MiB ceiling

---

## 安装 / Installation

```sh
# GitHub 仓库安装 / Install from the GitHub repo
dsh plugin --profile web add github:dhb861832993-star/pbr-render

# 或本地开发 / Or for local development
pnpm install
node scripts/build.mjs
dsh plugin --profile web add link:/path/to/pbr-render
```

重启 dsh web，新会话生效。
Restart dsh web; takes effect on a new session.

---

## 使用 / Usage

插件自动注入系统提示教学。模型在合适场景主动调用 `pbr_render` 工具验证路径，然后输出 `pbr3d` 围栏：
The plugin injects a system-prompt guide automatically. The model calls the `pbr_render` tool to validate the path, then emits a `pbr3d` fence:

````markdown
```pbr3d
{"model":"E:/generated/robot.glb","autoRotate":true,"label":"API 生成的机器人 / API-generated robot"}
```
````

### 围栏规格 / Fence Spec

| 字段 / Field | 类型 / Type | 默认 / Default | 说明 / Description |
|---|---|---|---|
| `model` | string | **必填 / required** | 模型路径（绝对或相对工作区），.glb/.gltf/.fbx / model path (absolute or workspace-relative), .glb/.gltf/.fbx |
| `autoRotate` | boolean | true | 自动旋转 / auto-rotate |
| `background` | string | `#14161c` | 场景背景色（`envBackground:true` 时被 HDR 背景覆盖）/ scene background color (overridden when `envBackground:true`) |
| `env` | string | studio | 内置 HDR 环境图：`studio` / `sunset` / `outdoor` / `sunrise` / `night`（CC0, Poly Haven 1K）/ built-in HDR environment |
| `envBackground` | boolean | false | 同时把 HDR 环境图显示为场景背景 / also show the HDR environment as the scene background |
| `envIntensity` | number | 1.0 | 环境光照强度（HDR/IBL 亮度）/ environment light intensity |
| `exposure` | number | 1.0 | 曝光 0.2–3 / exposure 0.2–3 |
| `viewMode` | string | pbr | 初始材质视图 / initial material view |
| `label` | string | — | 视图说明文字 / caption under the viewer |

### 材质通道模式 / Material-Channel Modes

| 模式 / Mode | 显示 / Shows |
|---|---|
| `pbr` | 完整物理渲染 / full physically-based render |
| `basecolor` / `normal` / `emissive` | 彩色贴图通道 / color map channels |
| `roughness` / `metallic` / `ao` | 标量通道灰度显示（R/G/R 通道提取）/ scalar channels in grayscale (R/G/R extraction) |
| `wireframe` | 线框 / wireframe |

---

## 架构 / Architecture

- `lib/index.js` — host 半边：`pbr_render` 工具 + 文件服务路由 + 系统提示段 / host half: the `pbr_render` tool + file-service route + system-prompt section
- `lib/client.js` — 浏览器半边：DOM 观察 `pbr3d` 围栏 → 按需加载 three 资产 → PBR 渲染 / browser half: DOM-watches `pbr3d` fences → lazy-loads the three assets → renders PBR
- `src/three-entry.js` + `scripts/build.mjs` — three.js 引擎打包（esbuild）/ three.js engine bundling via esbuild
- `lib/assets/env/*.hdr` — 内置 HDR 环境图（CC0, Poly Haven 1K，RGBE 格式）/ built-in HDR environments (CC0, Poly Haven 1K, RGBE)
- `test-model.glb` / `test-tex.glb` — 演示模型（单色 + 全套贴图）/ demo models (solid-color + full texture set)

---

## 安全 / Security

- 文件服务仅暴露工作区内的路径（防目录穿越）/ the file service only exposes paths inside the workspace (traversal-safe)
- 仅放行模型/纹理扩展名（.glb/.gltf/.bin/.ktx2/.hdr/.png/.jpg/.webp/.avif）/ only model/texture extensions are allowed
- 文件上限 512 MiB / 512 MiB file ceiling

---

## License

MIT