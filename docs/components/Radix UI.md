# Radix UI 组件文档

## 用途

`packages/web` 消费 Radix UI primitive，并在 `packages/web/src/components/ui/` 统一封装为本项目 UI 门面。业务组件只应从 `@/components/ui` 引入包装后的组件，不直接 deep import Radix primitive。

## 引入

```tsx
import { Button, Dialog, DialogContent, Popover, PopoverContent } from '@/components/ui';
```

来源依赖：

| 包 | 当前声明版本 | 当前源码用途 |
|---|---|---|
| `@radix-ui/react-dialog` | `^1.1.15` | `Dialog`、`DialogContent`、设置弹窗、背包弹窗、死亡弹窗 |
| `@radix-ui/react-popover` | `^1.1.15` | 新游戏小说选择、删除存档确认 |
| `@radix-ui/react-context-menu` | `^2.2.16` | 背包物品右键菜单 |
| `@radix-ui/react-slot` | `^1.2.4` | `Button asChild` 组合 |
| `@radix-ui/react-dropdown-menu` | `^2.1.16` | MISSING：依赖已声明，当前源码未发现直接 import |

## Props

| 名称 | 类型 | 默认值 | 必填 | 说明 |
|---|---|---|---|---|
| `DialogContent.showClose` | boolean | `true` | 否 | 是否渲染右上角关闭按钮 |
| `DialogContent.className` | string | 无 | 否 | 追加到固定居中弹窗容器 |
| `Popover.className` | string | 无 | 否 | 追加到外层 inline-flex 容器 |
| `PopoverContent.align` | Radix align | `center` | 否 | 浮层对齐方向 |
| `PopoverContent.sideOffset` | number | `8` | 否 | 浮层与触发器距离 |
| `Button.asChild` | boolean | `false` | 否 | 为 `true` 时通过 Radix Slot 组合子元素 |

其余 Radix primitive props 透传给对应 Radix 组件。

## 事件与回调

| 名称 | 触发时机 |
|---|---|
| `Dialog.onOpenChange` | 弹窗打开状态变化 |
| `Popover.onOpenChange` | 浮层打开状态变化 |
| `ContextMenuItem.onSelect` | 菜单项被选择 |
| `DialogClose` / `PopoverClose` click | 用户确认关闭或取消 |

## 插槽或 Children

- `DialogContent` children 承载业务弹窗内容，关闭按钮由 `showClose` 控制。
- `Popover` children 通常包含 `PopoverTrigger` 和 `PopoverContent`。
- `ContextMenuTrigger` 在背包物品中使用 `asChild` 包裹业务条目。
- `Button asChild` 依赖 Slot 将按钮样式传给子元素。

## 状态

- Dialog 用于设置、新开游戏、读取存档、背包和死亡状态展示。
- Popover 用于小说搜索选择和删除确认。
- ContextMenu 用于背包物品查看、使用、置顶、丢弃。
- DropdownMenu 依赖已安装但未发现当前源码使用，状态为 MISSING usage。

## 可访问性

- `DialogTitle` 必须在弹窗内容中出现；纯视觉说明可用 `DialogDescription` 的 `sr-only`。
- 图标触发器必须提供 `aria-label`，例如删除存档按钮。
- `DialogContent` 默认有遮罩和关闭按钮，禁用关闭按钮时必须提供等价退出路径。
- `ContextMenuItem` 禁用态使用 Radix `data-disabled` 样式并阻止交互。

## 示例

```tsx
<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
  <DialogContent>
    <DialogTitle>设置</DialogTitle>
  </DialogContent>
</Dialog>
```

```tsx
<Popover>
  <PopoverTrigger aria-label="选择参考小说">选择小说</PopoverTrigger>
  <PopoverContent align="start">...</PopoverContent>
</Popover>
```

## 测试建议

- 使用真实浏览器或 Testing Library 验证 Dialog/Popover 的打开、关闭、焦点移动和键盘退出。
- 背包右键菜单应覆盖 `onSelect` 对查看、使用、置顶、丢弃的回调触发。
- MISSING：当前未发现这些 Radix 包装组件的专门组件测试。

## 变更记录

- 2026-06-07：初始化外部组件消费文档，来源为 `packages/web/package.json` 与 `packages/web/src/components/ui/`。
