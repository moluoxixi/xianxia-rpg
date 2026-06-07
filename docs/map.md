# 项目文档地图

## 文档入口

| 目录 | 索引 | 用途 |
|---|---|---|
| architecture | [架构文档索引](architecture/index.md) | 记录项目架构、模块边界、分层、数据流、权限模型、部署关系和架构决策。 |
| api | [外部接口文档索引](api/index.md) | 记录当前项目消费的外部 API、上游服务、SDK 或 generated client 契约。 |
| out-api | [对外 API 文档索引](out-api/index.md) | 记录当前项目提供给前端、第三方、测试代理或其它服务复用的 API 契约。 |
| components | [外部组件库文档索引](components/index.md) | 记录当前项目消费的外部组件库、Design System、UI SDK 或 workspace 组件包约束。 |
| prds | [需求文档索引](prds/index.md) | 记录业务背景、目标、范围、流程、字段口径、验收标准和变更历史。 |
| test | [测试文档索引](test/index.md) | 记录测试策略、用例矩阵、数据准备、联调验证、回归范围和风险。 |
| other | [其它文档索引](other/index.md) | 登记初始化前已存在但尚未归入架构、接口、需求、组件或测试目录的项目文档。 |

## 维护约定

- 新增业务文档时，使用稳定业务名作为文件名，例如 `采购订单.md`。
- 架构文档放入 `docs/architecture/`，当前项目消费的外部接口文档放入 `docs/api/`，当前项目提供的 API 契约放入 `docs/out-api/`，需求文档放入 `docs/prds/`，测试文档放入 `docs/test/`，外部组件库消费文档放入 `docs/components/`。
- 初始化前已存在但暂未归类的文档登记到 `docs/other/index.md`；整理时先评估归属，不得自动移动或覆盖用户文档。
- 外部接口消费协议维护在 `docs/api/_protocol.md`；当前项目提供的 API 全局协议维护在 `docs/out-api/_protocol.md`；业务接口文档不得重复定义冲突协议。
- 新增或改名文档后，同步更新对应目录的 `index.md` 和本文件。
- 文档只记录已确认事实；缺失信息标记为 `MISSING`，不得用代码推断伪造业务结论。
