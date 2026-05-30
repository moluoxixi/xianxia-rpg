# @xianxia-rpg/core

跨 Web、Electron shell 和 Nest API 复用的契约包。

- `index.ts` 是唯一公共门面。
- `src/` 只放类型、常量和纯函数，不依赖 React、Electron 或浏览器运行时。
- Web 和 Electron shell 只能依赖这里定义的 host client 契约，不能穿透后端实现目录。
