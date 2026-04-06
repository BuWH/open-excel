# MCP、Conductor 与跨应用协作

## 1. MCP 是一等能力

样本中可直接确认：

- 远程列表接口：`https://api.anthropic.com/v1/mcp_servers`
- registry：`https://api.anthropic.com/mcp-registry/v0/servers`
- proxy：`https://mcp-proxy.anthropic.com/v1/mcp/<id>`
- beta header：`anthropic-beta: mcp-servers-2025-12-04`

这说明前端支持至少两种 MCP 来源：

1. Anthropic 官方远程 registry / proxy
2. 用户或企业通过 `mcp_servers` 注入的自定义 MCP server

## 2. `mcp_servers` 注入方式

`mtn()` 相关逻辑表明：

- `mcp_servers` 来自 manifest / bootstrap / customerConfig
- 值必须是 JSON 数组
- 支持模板占位符，例如 `{{some_key}}`
- 模板值从 `manifest + customerConfig` 合并结果中取
- 可区分 `discover` 模式和直接 headers 模式

如果 JSON 非法或不是数组，前端会记录 warning。

## 3. MCP 初始化过程

可见的初始化步骤包括：

- `initialize`
- `notifications/initialized`
- `tools/list`
- 页面重新可见时触发 refresh

这表明它不是只在初次打开时接 MCP，一旦页面回到前台还会尝试刷新。

## 4. conductor 的定位

conductor 不是“一个工具名”，而是一整套跨 agent 通信层：

- 连接地址：`wss://bridge.claudeusercontent.com`
- agent id 格式：`excel-xxxxxx` / `ppt-xxxxxx` / `word-xxxxxx` 这种前缀风格
- 注册时会带：
  - `agentId`
  - schema
  - `oauth_token` 或 `dev_user_id`
  - `peer_retention`

它管理的不是单条消息，而是：

- agent online / offline
- transcript
- status
- file broadcast
- replay
- activate

## 5. 共享文件系统

conductor 为各 agent 暴露了虚拟共享目录：

- `/agents/<agent-id>/transcript.jsonl`
- `/agents/<agent-id>/files/<filename>`
- `/agents/<agent-id>/metadata.json`
- `/agents/<agent-id>/status.json`

而且前端里有一套受限 bash：

- 白名单命令包括 `cat head tail grep ls stat find jq wc tree ...`
- 明确禁止写文件和真实 shell 能力
- 目的是“查看别的 agent 发来的摘要和文件结构”，而不是执行系统命令

## 6. 对模型暴露的 conductor 工具

至少能看到：

- `get_connected_agents`
- `send_message`
- `bash`

此外，`execute_office_js` 运行时还额外挂了：

- `conductor.writeFile(...)`
- `conductor.readFile(...)`
- `conductor.listFiles(...)`

这意味着大数据跨 agent 传输并不走聊天文本，而是走共享文件。

## 7. Excel -> PowerPoint 图表协作链路

这是当前样本里最有价值的一条证据链：

1. Excel agent 调 `extract_chart_xml`
2. 懒加载 `chartXmlExtractor-CDy1bJen.js`
3. 导出：
   - `chart.xml`
   - `chart-style.xml`
   - `chart-colors.xml`
4. 通过 conductor 广播到共享文件系统
5. 再 `send_message` 给 PowerPoint agent

bundle 里的提示词还明确要求：

- 不要在消息文本里重建图表数据
- 不要把 XML 文本直接塞进消息
- 只发送“请插入哪个 chart”的短消息

这说明产品真正支持“结构化 chart OOXML 交接”，而不是截图搬运。

## 8. feature gate

conductor 不是默认无条件打开：

- 要看本地 capability
- 要看组织级 disabled features
- 要看用户设置 `conductorEnabled`
- onboarding 里还能显式引导开启 cross-file access

所以 cross-file / work across apps 是一个被策略和设置共同控制的能力。

## 9. 结论

MCP + conductor 共同把这个 add-in 变成了“Office 里的 agent 节点”：

- MCP 负责接外部工具与企业系统
- conductor 负责 Office 应用之间的消息与文件中继

如果只把它理解成“Excel 里问答”，会低估它的真实能力边界。

