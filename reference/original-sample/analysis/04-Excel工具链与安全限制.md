# Excel 工具链与安全限制

## 1. 结构化工具不是薄封装

当前样本暴露的 Excel 结构化工具包括：

- `get_cell_ranges`
- `get_range_as_csv`
- `search_data`
- `read_range_image`
- `set_cell_range`
- `modify_sheet_structure`
- `copy_to`
- `resize_range`
- `clear_cell_range`
- `get_all_objects`
- `modify_object`
- `extract_chart_xml`

这些工具本身就带了较强的业务语义，不只是简单把 Office API 名字透给模型。

## 2. 读工具的差异

### `get_cell_ranges`

- 可按范围分页
- 可带 `includeStyles`
- 可返回公式、note、style、border
- 更适合保真读取

### `get_range_as_csv`

- 更偏分析和 code execution 场景
- 直接给 CSV
- 但会丢公式与样式

### `search_data`

- 可按 sheet 或全局搜
- 支持 regex、match case、match entire cell
- 可选按公式搜索

### `read_range_image`

- 直接把 range 渲染成图片
- 用于查看视觉结构、条件格式、合并单元格等

## 3. 写工具的行为约束

### `set_cell_range`

它比表面上更复杂：

- 默认不允许覆盖已有非空单元格
- 如果命中非空单元格，会抛出明确的 overwrite 错误
- 可返回 `formula_results`
- 默认保留已有格式
- 可配合 `copyToRange`
- 可配合 `resizeWidth` / `resizeHeight`

这说明它并不是“直接写 cells”，而是带了一层产品级 guardrail。

### `modify_sheet_structure`

- 适合插入/删除/隐藏/冻结行列
- 明确建议优先用于结构变更，而不是拿 `set_cell_range` 硬写

### `copy_to` / `resize_range` / `clear_cell_range`

- 三者都对应高频编辑动作
- 让模型不必自己手写复杂 Office.js 代码

## 4. `extract_chart_xml`

这是一个非常关键的专用工具：

- 只用于 conductor chart-sharing flow
- 不是通用图表读取工具
- 会做 PowerPoint 兼容转换
- 会去掉 workbook references
- 会自动广播共享文件

而且它是懒加载 chunk：

- `assets/chartXmlExtractor-CDy1bJen.js`

当前本地样本只有主 bundle，没有拿到这个懒加载 chunk 的历史对应文件，因此图表 XML 转换的实现细节还没有完全还原。

## 5. `execute_office_js` 沙箱

这是最重要的“逃逸边界”观察点。

从样本看，它做了多层防护：

### 运行时隔离

- 使用 SES `lockdown(...)`
- 通过 `Compartment` 执行代码
- 禁掉 `eval`
- 禁掉 `Proxy` / `Reflect` 直通
- 对 `Object` / `Function` 做了代理和裁剪

### Office 对象限制

- 屏蔽部分危险或不需要的 Office / Excel / Word / PowerPoint API 入口
- 对 setter 和 method 调用做包装
- 对 Excel 公式写入做黑名单检查

### OOXML / Base64 文件写入限制

- 拒绝 VBA project
- 拒绝 ActiveX
- 拒绝 XLM macro sheets
- 拒绝 OLE embeddings
- 检测外部引用
- 必要时走用户确认

### 文件与图片辅助对象

- `blobs`：读 skill 打包文件和上传文件
- `attachImage(...)`：把 Office `getImage()` 结果作为图像结果返给模型

并且对 Excel for Mac 做了专门限制：

- `Range.getImage()` 不可靠
- 推荐只对 chart 使用 `attachImage`

## 6. 这套工具设计透露的产品思路

可以看出设计不是二选一：

- 不是全靠 structured tools
- 也不是全靠自由代码执行

而是：

1. 高频稳定动作走 structured tools
2. 复杂宿主操作走 `execute_office_js`
3. 再用沙箱和 guardrail 限制风险

这是一种很典型的 agent runtime 设计。

## 7. 额外观察

- Word 和 PowerPoint 的工具说明、系统提示也被打进同一 bundle。
- 其中 PowerPoint OOXML 操作能力很重，Word 则强调 tracked changes / comments。
- 因此这个 Excel 样本其实也能帮助还原同一工程对 PPT/Word 的设计。

