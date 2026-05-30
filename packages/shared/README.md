# @xianxia-rpg/shared

跨 Electron 主进程、preload、renderer 和纯网页构建复用的契约包。

- `index.ts` 是唯一公共门面。
- `src/` 只放类型、常量和纯函数，不依赖 React、Electron 或浏览器运行时。
- Renderer 和 Electron IPC 只能依赖这里定义的 host client 契约，不能互相穿透实现目录。
