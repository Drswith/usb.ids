# usb.ids

[![npm version](https://badge.fury.io/js/usb.ids.svg)](https://badge.fury.io/js/usb.ids)
[![Auto Update](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml/badge.svg)](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml)
[![GitHub Pages](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml/badge.svg)](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml)

一个自动化的 USB 设备 ID 数据库项目，每 24 小时自动获取最新的 USB.IDS 数据并发布到 npm。

## 🚀 功能特性

- **自动更新**: 每 24 小时自动检查并获取最新的 USB.IDS 数据
- **多格式支持**: 提供原始格式和 JSON 格式的数据
- **npm 发布**: 自动发布到 npm 包管理器
- **GitHub Pages**: 提供在线查看界面
- **版本管理**: 基于内容哈希的智能版本控制
- **数据统计**: 提供供应商和设备数量统计

## 📦 安装

```bash
npm install usb.ids
# 或
pnpm add usb.ids
# 或
yarn add usb.ids
```

## 🔧 使用方法

### 作为 npm 包使用

```javascript
import { getUsbIds } from 'usb.ids'

// 获取 USB 设备数据
const usbData = await getUsbIds()
console.log(usbData)
```

### 直接访问数据文件

项目提供以下数据文件：

- `usb.ids` - 原始格式的 USB 设备数据
- `usb.ids.json` - JSON 格式的 USB 设备数据
- `usb.ids.version.json` - 版本信息和统计数据

## 🌐 在线查看

访问 [GitHub Pages](https://drswith.github.io/usb.ids/) 在线查看 USB 设备数据库。

## 🤖 自动化流程

### 数据更新流程

1. **定时触发**: 每天 UTC 0点自动执行
2. **数据获取**: 从官方源获取最新的 USB.IDS 数据
3. **变更检测**: 通过内容哈希检测数据是否有更新
4. **版本生成**: 基于时间戳生成新版本号
5. **构建发布**: 自动构建并发布到 npm
6. **GitHub Release**: 创建 GitHub 发布版本
7. **Pages 部署**: 更新 GitHub Pages 网站

### 数据源

- 主要源: http://www.linux-usb.org/usb.ids
- 备用源: https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids

## 📊 数据格式

### JSON 格式示例

```json
{
  "vendors": {
    "1234": {
      "name": "Vendor Name",
      "devices": {
        "5678": "Device Name"
      }
    }
  }
}
```

### 版本信息格式

```json
{
  "version": "1.0.1756668652122",
  "contentHash": "abc123...",
  "fetchTime": 1756668652122,
  "fetchTimeFormatted": "2024-01-01 00:00:00",
  "vendorCount": 3000,
  "deviceCount": 25000
}
```

## 🛠️ 开发

### 环境要求

- Node.js >= 16
- pnpm (推荐)

### 本地开发

```bash
# 克隆项目
git clone https://github.com/Drswith/usb.ids.git
cd usb.ids

# 安装依赖
pnpm install

# 获取最新数据
pnpm run fetch-usb-ids

# 启动开发服务器
pnpm run dev

# 构建项目
pnpm run build

# 运行测试
pnpm run test
```

### 脚本命令

- `pnpm run fetch-usb-ids` - 获取最新的 USB.IDS 数据
- `pnpm run version-info` - 生成版本信息
- `pnpm run check-update` - 检查是否有更新
- `pnpm run dev` - 启动开发服务器
- `pnpm run build` - 构建项目
- `pnpm run test` - 运行测试

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

- [GitHub Issues](https://github.com/Drswith/usb.ids/issues)
- [GitHub Sponsors](https://github.com/sponsors/Drswith)

## 🔗 相关链接

- [npm 包](https://www.npmjs.com/package/usb.ids)
- [GitHub 仓库](https://github.com/Drswith/usb.ids)
- [在线查看](https://drswith.github.io/usb.ids/)
- [USB.IDS 官方网站](http://www.linux-usb.org/usb.ids)
