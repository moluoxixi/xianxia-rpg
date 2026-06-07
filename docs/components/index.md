# 外部组件库文档索引

本目录记录当前项目消费的外部组件库、Design System、UI SDK 或 workspace 组件包约束；普通业务组件和本项目自有组件库对外契约不得写入本目录。

## 来源证据

- `packages/web/package.json` 声明 `@radix-ui/react-context-menu`、`@radix-ui/react-dialog`、`@radix-ui/react-dropdown-menu`、`@radix-ui/react-popover`、`@radix-ui/react-slot`。
- `packages/web/src/components/ui/` 对 Radix Dialog、Popover、ContextMenu、Slot 做了本项目包装。

## 组件库清单

| 组件库 | 文档 | 依赖版本 | 使用场景 | 状态 |
|---|---|---|---|---|
| Radix UI | [Radix UI](Radix%20UI.md) | `@radix-ui/react-dialog@^1.1.15`、`@radix-ui/react-popover@^1.1.15`、`@radix-ui/react-context-menu@^2.2.16`、`@radix-ui/react-slot@^1.2.4`、`@radix-ui/react-dropdown-menu@^2.1.16` | 弹窗、浮层、右键菜单、asChild 组合 | confirmed |
