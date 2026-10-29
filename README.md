# dsh-vibekey-focus

VibeKey / 输入法语音听写的**输入框焦点**插件，兼带审批卡片和 `ask_user_question` 问题卡片的键盘/旋钮导航。

## 解决的问题

优篮子 AU05 Vibe Key 通过 Ulanzi Studio 把按键映射成快捷键。常见的“说话键”是 `Ctrl+Win`，由微信输入法等听写工具接管；识别出的文字只会提交到**当前有焦点的可编辑控件**。

如果焦点不在 DeepSeek Harness 的对话输入框（例如刚点过一条消息、侧栏按钮或页面空白处），文字就没有落点，看起来像“没有输入上去”。

本插件在 DSH 客户端内维护焦点：

- 窗口重新获得焦点、从后台切回、切换会话时，把焦点送回对话输入框；
- 点击页面非输入区域（未拖选文字）后，把焦点送回输入框；
- 在非输入区域按键时，先把焦点送回输入框；
- 审批卡片出现时聚焦审批面板，`Enter` = 允许一次，`Esc` = 拒绝；
- 多选项问题卡片出现时，旋钮可依次经过选项和**自定义答案输入框**；光标进入输入框后可直接按语音键听写；
- 弹窗、菜单、其他输入框有焦点时不会抢焦点。

插件不会自动批准任何操作，也不会录制音频或联网：只有真实按键/点击才会产生审批或提交。

## 安装

从 npm 安装（推荐）：

```bash
dsh plugin --profile web add dsh-vibekey-focus
```

DSH Desktop：在应用内打开 **设置 → 插件**，搜索 `dsh-vibekey-focus` 安装；桌面版的 `desktop` profile 由应用管理，不要手动改。

安装后如果提示需要重启，重启一次 DSH 即可。

## 兼容性

- 目标 DSH：`>=0.2.1-rc.3 <0.3.0`（`engines.dsh`）。
- 已在 DSH Desktop 0.2.1-rc.3 上实际使用。
- 选择器同时兼容当前 Lexical 输入框（`[data-composer-input]`）和旧版 textarea，并覆盖分屏视图的 `data-dsv-composer-card`。
- 依赖 DSH 的 DOM 标记；DSH 大版本升级后如果官方标记变化，可能需要更新插件。

## 权限与限制

- 纯客户端插件：不联网、不录音、不读写草稿内容，只处理焦点。
- 只在 DSH 窗口处于前台时生效；页面插件无法接收其他前台应用里的输入法文字。
- 审批卡片本身固定只有“拒绝 / 允许一次”两个动作；多选项请使用 `ask_user_question` 问题卡片。

## 使用建议

- Ulanzi Studio 的 DSH 配置里，“说话键”保持触发听写工具的快捷键（例如 `Ctrl+Win`）。
- 审批卡片：`Enter` = 允许一次，`Esc` = 拒绝；旋钮可在操作按钮间移动。
- 问题卡片：旋钮旋转经过选项和自定义答案输入框；在输入框里按语音键直接听写；`Enter` 提交。
- 如果个别场景仍丢字，可以在 Ulanzi Studio 里给说话键加“多动作”：先发 `Alt+Enter`（配合 dsh-session-hotkeys 聚焦输入框），再发 `Ctrl+Win`。

## 许可

MIT。见 [LICENSE](./LICENSE)。

## 源码

<https://github.com/agengogogo/dsh-vibekey-focus>

