# USB.IDS 版本管理

本项目现在支持完整的版本管理功能，可以跟踪USB设备数据的获取时间、内容变化和更新周期。

## 功能特性

- 📅 **获取时间记录**: 记录每次数据获取的精确时间
- 🔐 **内容哈希验证**: 使用SHA256哈希值检测内容变化
- ⏰ **智能更新策略**: 默认7天更新周期，避免频繁请求
- 📊 **数据统计**: 记录供应商和设备数量
- 🔄 **强制更新支持**: 支持手动强制更新

## 使用方法

### 获取USB设备数据

```bash
# 正常获取（遵循更新周期）
npm run fetch-usb-ids

# 强制更新（忽略更新周期）
npm run fetch-usb-ids -- --force
# 或
npm run fetch-usb-ids -- -f
```

### 查看版本信息

```bash
npm run version-info
```

输出示例：
```
📋 USB.IDS 版本信息
==================================================
版本号: v1756664392
获取时间: 2025/09/01 02:19:52
数据源: 远程API
供应商数量: 3427
设备数量: 20528
内容哈希: b0f613be015190ba0462d3cce71c0c662ae0a1476a0a181b647ef93a0722f5bf
下次更新时间: 2025/09/08 02:19:52
状态: ✅ 最新版本
```

## 版本文件

版本信息保存在 `usb.ids.version.json` 文件中，包含以下字段：

```json
{
  "fetchTime": 1756664570821,
  "fetchTimeFormatted": "2025/09/01 02:22:50",
  "contentHash": "b0f613be015190ba0462d3cce71c0c662ae0a1476a0a181b647ef93a0722f5bf",
  "source": "api",
  "vendorCount": 3427,
  "deviceCount": 20528,
  "version": "v1.0.1756664570"
}
```

### 字段说明

- `fetchTime`: 获取时间戳（毫秒）
- `fetchTimeFormatted`: 格式化的获取时间
- `contentHash`: 文件内容的SHA256哈希值
- `source`: 数据源（`api` 或 `fallback`）
- `vendorCount`: 供应商数量
- `deviceCount`: 设备数量
- `version`: 版本号（格式：`v1.0.时间戳`）

## 更新策略

1. **智能检查**: 每次运行时检查是否需要更新
2. **时间周期**: 默认24小时更新一次
3. **内容验证**: 即使到了更新时间，如果远程内容未变化也会跳过
4. **强制更新**: 使用 `--force` 参数可以忽略所有检查

## 文件结构

```
├── usb.ids                    # 原始USB IDs文件
├── usb.ids.json              # 解析后的JSON格式数据
└── usb.ids.version.json      # 版本信息文件
```

## API 集成

在代码中可以使用以下函数：

```typescript
import {
  createVersionInfo,
  loadVersionInfo,
  saveVersionInfo,
  shouldUpdate
} from './plugins/plugin-usb-ids/utils'

// 读取版本信息
const versionInfo = loadVersionInfo('./usb.ids.version.json')

// 检查是否需要更新
const needsUpdate = shouldUpdate(versionInfo)

// 创建新的版本信息
const newVersion = createVersionInfo(data, rawContent, 'api')

// 保存版本信息
await saveVersionInfo(newVersion, './usb.ids.version.json')
```
