# 发布与上架指南

这个目录已经是可发布的 npm 包 `dsh-vibekey-focus`，GitHub 仓库地址是：

<https://github.com/agengogogo/dsh-vibekey-focus>

`package.json` 里的 `author` / `repository` / `homepage` / `bugs` 已按这个仓库填好。包名 `dsh-vibekey-focus` 已在 npm registry 查过，当前未被占用。如果以后要改包名，同步修改：

- `package.json` 的 `name`
- `client.js` 第 2 行的 `id`
- `cordis.patch.yml` 的 `name`

三处必须完全一致，否则市场能安装但客户端不会加载。

## 1. 本地打包校验

```bash
cd vibekey-focus-publish
npm pack --dry-run
```

应看到 `client.js`、`cordis.patch.yml`、`locale/*.json`、`icon.svg`、`index.js`、`README.md`、`LICENSE` 都在 tarball 里。本目录已经跑过一次，9 个文件、约 10 KB。

## 2. 发布到 npm

```bash
npm login
npm publish --access public
```

发布后确认：

```bash
npm view dsh-vibekey-focus version
```

## 3. 在干净 profile 里验证

桌面版的 `desktop` profile 由应用管理，不要手动改。用 `web` profile 或另一台测试：

```bash
dsh plugin --profile web add dsh-vibekey-focus
```

或在 DSH Desktop 的 **设置 → 插件** 搜索安装。注意：当前 `desktop` profile 里还装着一个本地链接版 `@local/dsh-vibekey-focus`；如果要在同一个 profile 里测试发布版，先把本地版卸载，否则两个焦点组件会同时运行。

验证项：

- 对话输入框失焦后按 VibeKey 说话，文字是否落回输入框；
- 审批卡片出现时，`Enter` 允许、`Esc` 拒绝；
- 问题卡片里旋钮能否经过选项和“自定义答案”输入框；
- 不联网、不录音。

## 4. 推送到 GitHub 仓库

仓库已创建：<https://github.com/agengogogo/dsh-vibekey-focus>（当前为空）。

```bash
cd vibekey-focus-publish
git init -b main
git add .
git commit -m "Initial release: dsh-vibekey-focus 0.1.0"
git remote add origin https://github.com/agengogogo/dsh-vibekey-focus.git
git push -u origin main
```

推送后在 GitHub 仓库 **Settings → Topics** 添加 `dsh-plugin`。仓库描述已经可以写：

> deepseek harness focus to enable vibekey operation

## 5. 提交到三个市场

### Open Plugin Market（dshopen.org）

在 [dsh-plugin-index 的 plugin-add 模板](https://github.com/polang233/dsh-plugin-index/issues/new?template=plugin-add.yml) 提 issue，填写：

- npm 包名：`dsh-vibekey-focus`
- 公开 GitHub 仓库
- 许可证：MIT
- Logo：`icon.svg`
- 完整描述、分类、截图/演示

该市场有人工/安全审查，收录后可在 DSH 的 Discover / Open Market 里看到。

### DSH Plugin Hub（dsh-plugin.org）

按[提交页](https://dsh-plugin.org/zh/submit)操作：公开仓库 + `dsh-plugin` topic + README 安装命令 + 根目录 `package.json`。自动扫描后先显示 `unconfirmed`，人工复核后变 `verified`。有 npm 包才会进入 DSH 内的“插件中心”一键安装列表。

### dshmarket（awesome-dsh-plugin）

到 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 提 PR，加一条收录；`dshmarket.com` 和 dshmarket 会同步。

## 6. 更新版本

```bash
npm version patch   # 或 minor / major
npm publish --access public
```

市场会定期刷新版本、README、Star 等元数据，不需要重复提交。README 和 release 保持更新即可。

## 安全与权限说明（提交时可直接用）

- 纯客户端插件，无网络请求、无遥测、不录音、不读取草稿内容。
- 只处理焦点和键盘事件。
- 只在 DSH 窗口前台时生效；无法接收其他前台应用的输入法文字。
- 依赖 DSH 的 DOM 标记，DSH 大版本升级后可能需要更新。
