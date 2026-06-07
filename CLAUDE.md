# 项目规范

# 前端工程架构与代码规范

在执行任何前端代码生成、重构或结构化任务时，必须没有例外地遵守以下物理架构与代码交付红线。

## 0. 适用边界

- **项目事实优先**：先读取当前项目的框架版本、构建配置、测试入口和既有目录约定；不得为了套用本规范擅自升级依赖、改写项目架构或伪造验证入口。
- **Vue 3.5+ 约束范围**：现代 Vue 语法只强制适用于已确认支持 Vue 3.5+ 与相关宏的 Vue 代码。React、非 Vue 代码或旧版 Vue 项目只适用目录、门面、测试和交付规则；若版本不匹配，必须在交付中说明约束。
- **业务路由模块例外**：`views/`、`pages/`、`app/`、`routes/` 等框架路由扫描目录下的页面聚合模块不属于独立包根目录，严禁为了制造层级再包一层 `src/`；其内部职责目录仍递归遵守门面规则。

## 1. 门面模式与统一入口

- 职责目录如 `components/`、`utils/`、`types/`、`composables/`、`hooks/` 必须对外表现为黑盒。
- 职责目录下必须存在 `index.ts` 作为统一转发出口。
- 包外、模块外和跨职责目录调用方禁止 Deep Import，必须通过门面引入。
- 类型定义必须在类型目录的 `index.ts` 中通过 `export type * from './xxx'` 统一暴露。
- 值导出优先使用显式命名导出，禁止用无差别 `export *` 暴露内部实现。
- 框架扫描目录、测试目录、样例目录、资产目录、样式目录、构建产物目录和 generated 目录不强制提供 `index.ts`。

## 2. 独立模块与组件目录骨架

- 根目录只承载对外契约和工程配置；对外生产 API 只能通过唯一根 `index.ts` 暴露。
- 所有具体逻辑、组件、样式代码必须收敛在 `src/` 内部，并递归遵守门面规则。
- 可复用 Props、Emits、Expose、Slots、Model、Ref、工具函数参数或返回类型必须收敛到 `src/types/`。
- 外部应用或其他模块只能引入该包根 `index.ts`，禁止直接读取其 `src/` 内部文件。
- 只有私有、叶子、无 API、无导出类型、无跨目录复用、无生产职责拆分的展示组件，才允许保持单文件。

## 3. 开发评审门槛

- 触发以下任一条件时，禁止直接生成生产代码或测试代码；必须先输出《前端实现与测试设计报告》，等待开发者确认后再进入生成阶段：
  - 新增、重构或拆分公共组件、可复用业务模块、工具函数、hooks/composables、类型契约或对外导出 API。
  - 涉及跨模块状态、路由、权限、表单、请求、缓存、上传、编辑器、图表、拖拽、复杂交互或用户可见核心流程。
  - 需要决定测试分层、Mock/fixture 策略、浏览器测试范围、覆盖率边界或异常路径验证方式。
  - 修改目录边界、门面出口、导入路径、构建配置、测试配置、组件库契约或框架集成方式。
  - 需求存在多个合理实现方案、验收标准不明确、存在迁移成本，或可能影响可访问性、性能、错误处理和数据安全。
- 同时满足以下条件时，可跳过前置评审直接实现，并在交付说明中报告依据：纯展示或样式微调、单文件叶子组件、无公共导出契约变化、无新增状态或异步流程、无跨模块交互、测试策略可直接沿用现有模式、存在可精准执行的验证脚本。
- 《前端实现与测试设计报告》必须包含：项目事实证据、改动范围、接口/类型契约、实现方案、测试分层与用例清单、Mock/fixture 策略、风险点和验证命令。报告阶段只允许读取和分析，不得创建或修改生产代码与测试文件。

## 4. 强制测试交付要求

- 进入实现阶段后，修改组件、核心工具逻辑、公共类型契约或可复用业务模块时，必须同步交付高质量测试代码。
- 测试文件必须放置在目标代码同级的 `__test__/` 目录下；跨模块 E2E 才允许放在项目根级 `__e2e__/`。
- 单元、工具函数、类型契约和组件基础挂载测试优先使用 Vitest；真实浏览器交互必须使用 Playwright 或项目既有真实浏览器测试工具。
- 禁止只写“能渲染/能跑通”的烟雾测试，必须验证实际契约、交互和核心边界条件。

## 5. 现代 Vue 语法强制红线

- Vue 3.5+ 声明 `v-model` 双向绑定契约时，强制使用 `defineModel`。
- 模板 DOM 或组件实例引用强制使用 Vue 3.5+ 的 `useTemplateRef`。
- Props 声明强制使用基于类型的 `defineProps`；需要默认值时配合 `withDefaults`。

# NestJS 工程架构与代码规范

在执行任何 NestJS 后端代码生成、重构或评审任务时，必须严格遵守以下物理边界与编码红线。

## 一、输入防腐与安全边界

- 全局强制启用 `ValidationPipe` 并配置 `whitelist: true`、`forbidNonWhitelisted: true`、`transform: true`。
- DTO 禁止使用 `any`、`Record<string, any>` 或开放索引签名。
- 进入 Application/Domain 层后，禁止重复编写手动防御性代码。
- 列表查询 DTO 必须显式定义分页最大上限与排序字段白名单。
- Tenant-scoped 数据必须从服务端可信会话获取 `tenantId`，禁止信任客户端载荷。

## 二、核心架构与事务防腐

- Controller 仅处理路由与 DTO 映射，禁止编排业务或操作 ORM。
- Domain 必须保持纯粹，禁止依赖 HTTP 宿主对象、ORM 注解或技术细节。
- `EntityManager`、`QueryRunner` 等底层事务句柄只能存在于 Infrastructure 层。
- 禁止将远程网络调用或文件 I/O 隐式裹挟在数据库事务中。
- 同库事务使用 UnitOfWork；跨系统调用使用 Transactional Outbox 模式。

## 三、依赖注入与作用域安全

- 所有 Provider 依赖必须通过构造函数显式声明，禁止字段注入。
- 禁止在底层模块滥用 `Scope.REQUEST` 或注入 `REQUEST`。
- AsyncLocalStorage 必须封装为统一 `RequestContext`，禁止 Domain 直接读取。
- 视 `forwardRef()` 为设计缺陷，必须通过领域事件或解耦重构消除环形依赖。

## 四、序列化脱敏与错误映射

- 响应数据默认不暴露，必须通过 Response DTO 映射。
- 使用 `plainToInstance(..., { excludeExtraneousValues: true })` 时必须确保字段显式 `@Expose()`。
- 业务逻辑禁止直接读取 `process.env`，必须通过强类型 Config Provider 注入。
- 业务代码只抛出自定义领域/应用错误，并通过 `cause` 保留原始异常。
- HTTP 状态码转换统一交由全局 Exception Filter 处理。

## 五、强制测试交付要求

- 修改 Controller、DTO、Pipe、Guard、Interceptor、Filter、Provider、UseCase、Repository、事务边界或序列化映射时，必须同步交付有效测试代码。
- 测试目录优先沿用项目既有约定；缺少约定时，单元/模块测试放在目标代码同级 `__test__/`，跨模块 E2E 放在项目根级 `__e2e__/`。
- Domain、UseCase 和 Provider 必须交付单元测试，验证业务契约、依赖协作、异常分支和上下文传播。
- Controller、DTO ValidationPipe、Exception Filter、Guard 和序列化映射必须交付接口或模块级测试，显式断言状态码、响应 DTO、脱敏字段、校验失败和权限失败。
- 涉及 TypeORM/Prisma、UnitOfWork、Transactional Outbox、Repository 或数据库约束时，必须交付集成测试；优先使用 `@nestjs/testing`、项目既有测试数据库、Testcontainers 或等价隔离环境。
- 测试框架优先使用项目既有 Jest、Vitest、Supertest 或真实浏览器/E2E 工具；禁止只保留 `contextLoads`、模块能编译、能返回 200 等低价值烟雾测试。

# 前端外部组件库文档规范

## 触发边界

- 本规范适用于前端项目消费外部组件库、Design System、UI SDK 或 workspace 组件包的场景。
- 当前项目自己的组件库输出不使用本规范；组件库项目对外契约由组件库输出规则和 `components-docs` 输出到 `docs/out-components/`。
- 修改外部组件库依赖版本、封装适配层、主题配置、组件使用约束、表单/弹窗/表格等公共用法，或初始化时发现已有外部组件库文档时，必须触发 `components-docs` 的 consumer mode。

## 输出边界

- 外部组件库消费文档输出到 `docs/components/`，用于约束本项目如何使用依赖组件库。
- 组件消费事实必须由 AI 读取 `package.json`、lockfile、源码 import、全局注册、主题配置、已有文档和示例后推导；不得只凭目录名生成正文。
- 普通业务组件不得写入 `docs/components/`；无法确认是否属于外部组件库时，先标记 `MISSING component ownership`，不得伪装为已归类。

# 后端 API 契约文档规范

## 触发边界

- 本规范适用于 HTTP API、GraphQL、RPC、Webhook、消息事件、后端 SDK 或其它向外部调用方暴露契约的后端项目。
- 修改路由、Controller、Resolver、DTO/schema、OpenAPI/Swagger、错误码、鉴权、分页、Headers、版本策略、Webhook、事件契约或 SDK 对外 API 时，必须触发 `api-docs` 的 provider mode。
- 修改外部服务调用、SDK/generated client、Feign/gRPC client、Webhook 消费、消息订阅、Mock 上游、环境变量服务地址或已有外部接口文档时，必须触发 `api-docs` 的 consumer mode。
- 领域规则、架构决策、测试策略仍分别交给 `prd-docs`、`architecture-docs`、`test-docs`；本规范只约束 API 对外契约输出。

## 输出边界

- 当前项目提供的 API 契约输出到 `docs/out-api/`，用于前端、第三方、测试代理或其它服务复用。
- 当前项目消费的外部 API、上游服务、SDK 或 generated client 契约输出到 `docs/api/`，用于约束本项目调用外部接口。
- 具体文档结构、字段、示例和写作规则以 `api-docs` 为准，本规则不重复描述。
- `docs/api/` 不得作为 `docs/out-api/` 的镜像目录；已有接口文档必须先判断 ownership 后再转换。
- API 契约事实必须由 AI 阅读后端源码、路由注册、DTO/schema、OpenAPI/Swagger、测试、Mock 和已有文档后推导；不得只依赖脚本或目录名生成正文。
- 更新 `docs/out-api/` 时必须维护 `docs/out-api/index.md` 的 `来源快照`；无法确认 commit 或工作区 dirty 时显式标记，不得伪造提交 ID。

# 项目文档知识库

## 读取顺序

- 当任务涉及架构、模块边界、需求、接口联调、组件实现、测试设计、业务流程、字段口径、验收标准或用户提到具体业务域时，必须先检索并读取 `docs/`。
- 优先读取 `docs/map.md`，再读取相关目录的 `index.md`，最后按关键词读取命中的业务文档。
- 涉及架构、分层、依赖方向、部署、权限模型或技术选型时，必须读取 `docs/architecture/index.md`、`docs/architecture/overview.md` 和相关 ADR。
- 涉及当前项目消费的外部接口、联调、请求封装、错误处理、分页、鉴权或 Mock 时，必须读取 `docs/api/_protocol.md` 和相关外部接口文档。
- 涉及当前项目提供给外部调用方的 API 契约时，必须读取 `docs/out-api/_protocol.md` 和相关提供方接口文档。
- 涉及当前项目消费的外部组件库、Design System、UI SDK 或 workspace 组件包时，必须读取 `docs/components/index.md` 和相关组件文档。
- 涉及当前项目自身组件库对外契约时，必须读取 `docs/out-components/index.md` 和相关组件文档。
- 若相关内容未在分类目录中找到，必须读取 `docs/other/index.md`，检查是否存在待整理的旧文档入口。
- 检索关键词必须包含用户原始业务词、可能的英文名、接口路径、页面路由、组件名、实体名和领域缩写。
- 若相关文档存在，以文档为业务事实来源，再结合 CodeGraph 分析代码结构；不得只凭代码反推需求。
- 若文档与代码、用户口径或其它文档冲突，必须停止并报告冲突位置；不得静默用代码覆盖文档事实。
- 若相关文档缺失，交付中标记 `MISSING docs`，并说明已检索的关键词和路径。

## 维护规则

- 新增或修改架构、PRD、API、组件、测试文档时，必须分别使用 `architecture-docs`、`prd-docs`、`api-docs`、`components-docs`、`test-docs`，并同步更新目录 `index.md` 与 `docs/map.md`。
- 文档按业务域独立成篇；例如 `docs/prds/采购订单.md`、`docs/api/采购订单.md`、`docs/test/采购订单.md`。
- 外部接口消费协议维护在 `docs/api/_protocol.md`；当前项目提供的 API 全局协议维护在 `docs/out-api/_protocol.md`；业务接口文档不得重复定义冲突协议。
- `docs/api/` 与 `docs/components/` 记录当前项目消费的外部接口和外部组件库；不得写入当前项目自己提供的 API 或组件库对外契约。
- `docs/out-api/` 与 `docs/out-components/` 记录当前项目提供给外部调用方或消费方复用的契约；不得作为内部知识库镜像目录。
- 架构决策维护在 `docs/architecture/decisions/`，影响模块边界、技术选型、数据模型、接口协议或部署拓扑时必须记录 ADR。
- 前端项目可包含 `docs/components/`；后端项目不强制创建组件文档目录。
- 初始化前已存在但暂未归类的文档登记在 `docs/other/index.md`；整理旧文档时必须先评估归属，不得自动移动或覆盖用户文档。
- 初始化前归档到 `docs/other/imported/` 的旧文档只能作为来源证据；未转换为标准分类文档前，不得作为长期业务事实使用。
- 不得把需求、接口、组件和测试内容混写到同一个文档；跨文档关系通过链接引用。

## 代码变更与文档同步

- 修改代码前，若任务涉及业务行为、接口契约、组件契约、架构边界、测试策略、权限、状态机、数据一致性或用户可见流程，必须先读取相关 docs。
- 修改代码过程中发现实现与 docs 不一致时，必须停止并报告冲突；不得静默让代码覆盖文档事实。
- 修改代码后，若行为、接口、组件、架构或测试策略发生变化，必须同步更新对应 docs、目录 `index.md` 和 `docs/map.md`。
- 若本次代码变更不需要更新 docs，交付中必须说明 `N/A docs` 及理由；若应更新但信息不足，标记 `MISSING docs update` 并说明缺口。

## 评审门槛

- L0 可直接执行：已有边界内的小补充、事实明确的字段或示例更新、沿用现有模式的低风险测试。
- L1 先输出变更摘要：轻微结构调整、索引或 `docs/map.md` 更新、不会改变公共契约的文档拆分。
- L2 必须先输出设计或拆分报告并等待开发者确认：架构边界、接口协议、错误码体系、分页策略、组件库契约、PRD 业务域拆分、测试策略、Mock/fixture 策略、E2E/联调范围、权限/状态机/数据一致性规则。
- 若无法判断属于哪个等级，按更高等级处理；不得用低等级绕过评审。
