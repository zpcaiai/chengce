# 承策（Chengce）

**把创始人的判断，变成组织可执行的系统。**

承策是一个面向创始人主导型公司的能力转移工作台，而不是通用项目管理或 AI 聊天工具。它把访谈和已有资料变成可追溯的组织资产，再通过负责人、审批、行动和月度报告验证“创始人依赖”是否真的下降。

## 已实现的最小闭环

1. 工作区、多成员角色、成员管理页和邀请链接的多租户边界；每个项目请求都由服务端根据成员关系授权。
2. 结构化创始人访谈、文本文件上传、音频转写（配置 OpenAI 后）和观察笔记组成证据库。
3. AI 从证据识别关键能力、创始人依赖、风险与初步转移动作。
4. AI 将选定证据编译为决策规则、运营原则或 Playbook；每个草稿带可审查引文，且可修订、重新审批、登记使用和修订反馈。
5. 审批、版本、复审时间、到期提醒、审计日志和带负责人/截止日/证明的 90 天行动板。
6. 月度复制报告：创始人依赖、知识覆盖、决策一致性、实际手册使用率与开放风险；可生成可撤销、可过期的只读链接和真正的 PDF 下载。
7. 本地可运行的 B2B 方案/席位模型；生产环境将同一订阅接口替换为支付网关 webhook。

## 开始

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

## 独立部署与真实订阅

最小独立部署使用 Docker Compose。复制 `.env.example` 为 `.env`，至少设置一个随机的 `AUTH_SECRET`，再启动：

```bash
docker compose up --build
```

容器会等待 PostgreSQL 健康检查，通过 `prisma db push` 建立 schema，再启动应用。`GET /api/health` 可用于负载均衡健康检查。

订阅使用 Stripe Checkout，而不是浏览器端写入权益：

1. 在 Stripe 创建三个**按席位、按月续订**的 Price：诊断版、落地版、持续订阅。
2. 将其 ID 设置为 `STRIPE_PRICE_DIAGNOSTIC`、`STRIPE_PRICE_DELIVERY`、`STRIPE_PRICE_CONTINUITY`，并设置 `STRIPE_SECRET_KEY`。
3. 在 Stripe 配置 webhook：`https://你的域名/api/webhooks/stripe`，订阅 `checkout.session.completed`、`customer.subscription.updated` 和 `customer.subscription.deleted`，将 signing secret 设置为 `STRIPE_WEBHOOK_SECRET`。
4. 将 `NEXT_PUBLIC_APP_URL` 设置为外部 HTTPS 域名。工作区所有者会在“订阅与席位”页进入 Stripe 托管结账与客户门户。

Webhook 使用 Stripe 原始请求体和签名验证；事件 ID 被持久化去重。只有签名事件会创建或更新生产订阅权益。

部署到 Vercel 时可将 Stripe 作为 Marketplace 集成，配置相同环境变量；CI 已在 `.github/workflows/ci.yml` 包含生成、类型检查与生产构建门槛。

默认 `AI_PROVIDER=mock`，可完整演示证据→诊断→资产→审批→报告闭环，无需 API Key。配置 `AI_PROVIDER=openai`、`OPENAI_API_KEY` 后切换为真实模型。

上传的 TXT/MD/CSV 会直接进入证据库；音频在设置 `OPENAI_API_KEY` 后调用转写 API。默认文件存储为本地 `UPLOAD_DIR`，部署到生产环境时应将该适配器换成私有对象存储，并保留相同的工作区授权校验。

本地开发使用 `DEV_USER_ID=usr_local`；生产环境必须移除它并设置足够强的 `AUTH_SECRET`，再通过注册/登录获取会话。

## 从 AreteOS 提取并重建的部分

- 保留：AI 提供商抽象、严格结构化输出、输入净化、密码与签名会话基础。
- 重建：SFM 的创始人模式/成功要素/复制手册，Management OS 的知识萃取、行动手册、依赖风险与组织报告。
- 明确排除：个人成长、疗愈、儿童、社区、消费会员、3D 可视化与泛化数字孪生。

旧项目的 `organizationId` 是允许请求提供的松散字段；承策不复用这一模式。新项目以 `Workspace → Membership → TransformationProject` 作为服务器端授权边界。

## 新增：组织诊断与中文报告（从 AreteOS 迁移）

在原有「证据 → 能力 → 规则/手册 → 行动 → 月度报告」闭环之上，新增了第 5 个模块 **组织诊断**（`/projects/[id]` 页面内）：

- **关键人依赖压力测试**：创始人/关键人一旦离开，组织从哪里先断裂；产出抗脆弱韧性、依赖热区与「最先断裂」场景。
- **管理杠杆**：把管理时间分类为低/中/高杠杆并给出转移建议。
- **组织健康 / 决策治理 / 协作分析**：各维度按证据打分并附引文。

每次诊断都基于项目证据、可回链引文、写入审计日志，并按工作区权限授权（运行需 ADVISOR 及以上）。月度报告据此计算 **可复制度（replication readiness）**、抗脆弱韧性与管理杠杆综合分，取代原先对创始人依赖的简单平均。

评分逻辑为纯函数（`src/lib/scoring/`），并有 Vitest 单元测试（`npm test`，已接入 CI 门槛）。诊断 Agent 默认走离线 mock provider，无需 API Key 即可演示完整闭环。

### 配置补充

- **中文 PDF**：报告 PDF 通过 pdfkit 内嵌 Noto Sans SC 子集（`public/fonts/NotoSansSC-report.otf`，约 1.5 MB，覆盖 GB2312 常用字 + ASCII + 标点），无需系统字体即可正确渲染中文。如需更全字符覆盖，设 `REPORT_FONT_PATH` 指向任意 TTF/OTF（生产镜像可改用系统 `fonts-noto-cjk`）。
- **Prisma Client 输出目录**：生成到 `src/generated/prisma`（已在 `.gitignore`，由 `npm run prisma:generate` / `npm run build` 重新生成）。
- 首次拉取后请执行 `npm install`（引入 pdfkit）与 `npm run prisma:generate`。

## 部署到 Vercel（自动建表 + 初始化数据）

仓库已内置 `vercel.json` 与 `vercel-build` 脚本，部署时**自动建表并写入初始数据**，无需手动迁移：

```
prisma generate → prisma db push（按 schema 自动创建/更新表） → prisma db seed（幂等写入演示数据） → next build
```

步骤：

1. 在 Vercel 接入一个 Postgres（Vercel Postgres、Neon、Supabase 等），它会注入 `DATABASE_URL`；或手动在 **Settings → Environment Variables** 添加。
2. 另外配置 `AUTH_SECRET`（随机长字符串）与 `NEXT_PUBLIC_APP_URL`（线上域名）。需要真实订阅时再加 `STRIPE_*`，需要真实 AI 时加 `AI_PROVIDER=openai` + `OPENAI_API_KEY`（默认 `mock` 即可跑通全流程）。
3. 部署。每次构建都会幂等地建表并补种子数据(`upsert`,可安全重复),首屏即有一个完整的演示项目（证据、能力、规则、行动、月度报告、组织诊断、数字孪生、决策复盘都有数据）。

> 说明：`prisma db push` 只做**增量**变更；若后续 schema 有破坏性变更需在构建命令追加 `--accept-data-loss`。Prisma 运行时引擎已通过 `binaryTargets = ["native","rhel-openssl-3.0.x"]` 覆盖 Vercel 平台。Docker 镜像在容器启动时同样会 `db push` + `db seed`。

## 邀请邮件直发（SendGrid，可选）

工作区「邀请成员」在配置后会**自动发送邀请邮件**（落地 `/invite/[token]`，已登录自动加入、未登录引导注册）。配置：

1. 在 SendGrid 创建 API Key 并完成发件人/域名验证。
2. 设置环境变量 `SENDGRID_API_KEY`、`EMAIL_FROM`（已验证发件人）、可选 `EMAIL_FROM_NAME`、`NEXT_PUBLIC_APP_URL`（用于邮件内链接域名）。

未配置时邮件发送优雅降级：接口仍返回邀请链接，设置页提示「请手动发给对方」，不会因缺少邮件配置而失败。

## 通知中心与定时复诊

- 站内**通知中心**（导航栏铃铛）：复审到期、行动被阻塞、创始人依赖回升会自动推送，按用户去重。
- 定时扫描走 `GET /api/cron/sweep`，由 `CRON_SECRET` 鉴权；`vercel.json` 已配置每天 08:00 触发（Vercel Cron 自动带 `Authorization: Bearer ${CRON_SECRET}`）。本地可 `curl "/api/cron/sweep?key=$CRON_SECRET"` 手动触发。
- **一键完整诊断**（项目页顶部）：串联运行全部组织诊断并生成月度报告。诊断卡现显示**可信度 ±区间与样本量**，避免伪精确。

## 评论 @提及、审批升级与 Slack 出站

- **评论与 @提及**：能力、规则、决策上可展开「讨论」，用 `@姓名/@邮箱` 提及成员会生成站内通知。
- **审批升级**：草稿资产可「批准」或「拒绝（带理由）」，拒绝退回草稿；每次决定都写入审批记录（资产卡「版本与审批历史」可查）。
- **Slack 出站**：配置 `SLACK_WEBHOOK_URL` 后，生成月报 / 一键完整诊断 / 决策复盘完成会自动推送到 Slack；未配置则静默跳过。

## 知识规模化：语义检索、高光提取、引文校验

- **语义检索**：证据库顶部的检索框。配置 `OPENAI_API_KEY`（可选 `OPENAI_EMBED_MODEL`，默认 `text-embedding-3-small`）后用嵌入向量按语义相关度排序（应用层余弦，无需 pgvector，惰性回填嵌入）；未配置则**优雅降级为关键词检索**（含中文字符级回退）。
- **访谈高光自动提取**：每条证据可一键「AI 提取关键判断时刻」，给出原文引用、为何重要、建议建模的能力/规则名。
- **引文校验**：一键核对所有 AI 引文是否真的出现在所引证据中（归一化空白与引号后子串匹配），列出无法核对的引文，防止幻觉。

## 企业级与销售闭环

- **品牌化客户只读门户**：工作区设置「客户门户品牌」可设品牌名 / Logo / 主色；对外分享的只读报告（`/share/[token]`）据此换肤，作为可转发的咨询交付物。
- **报告导出 PPT / Excel**：报告分享处新增「导出 PPT」「导出 Excel」（`/api/snapshots/[id]/pptx`、`/xlsx`，pptxgenjs / exceljs 生成，中文正常）。
- **行业模板库**：`选择模板` 内置 10 套行业起步模板（B2B SaaS、AI 产品、咨询、电商、制造、代理、教育、平台、空间服务、创始人系统），一键生成带 MVP/实验/能力雏形的工作区。
- **SSO / SCIM（脚手架）**：企业 SSO（SAML/OIDC）与 SCIM 需对接外部 IdP（Okta / Entra ID / Google Workspace），`src/lib/sso.ts` 已预留接入点，部署时配置 `SSO_*`。

## PPT 工坊（Gamma 式演示生成）

导航「PPT 工坊」(`/decks`)：

- **业务场景模板**：内置 8 套（创始人蓝图汇报、月度经营复盘、投资路演、销售提案、产品发布、季度 OKR、咨询诊断、团队介绍），点「用此模板」即得一份完整演示。
- **AI 生成**：给主题/场景/受众/要点，`DeckWriter` 自动组织 6–9 页（未配置 `OPENAI_API_KEY` 时用内置示例结构）。
- **6 套主题 + 8 种版式**（封面/章节/要点/双栏/指标/引言/时间线/结尾），换主题即换肤，所见即所得（`SlideView` 用 container-query 单位缩放）。
- **编辑**：改标题/正文、增删/上下移页、切主题、保存。
- **一键导出 PPTX**：`pptxgenjs` 按主题与版式渲染出设计感强的 PPT（左侧色条、强调下划线、圆角指标卡、大字排版），中文正常。
