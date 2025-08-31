# usb.ids

[![npm version](https://badge.fury.io/js/usb.ids.svg)](https://badge.fury.io/js/usb.ids)
[![Auto Update](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml/badge.svg)](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml)
[![GitHub Pages](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml/badge.svg)](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml)

An automated USB device ID database project that fetches the latest USB.IDS data every 24 hours and publishes it to npm.

## 🚀 Features

- **Auto Update**: Automatically checks and fetches the latest USB.IDS data every 24 hours
- **Multi-format Support**: Provides both raw format and JSON format data
- **npm Publishing**: Automatically publishes to npm package manager
- **GitHub Pages**: Provides online viewing interface
- **Version Management**: Smart version control based on content hash
- **Data Statistics**: Provides vendor and device count statistics

## 📦 Installation

```bash
npm install usb.ids
# or
pnpm add usb.ids
# or
yarn add usb.ids
```

## 🔧 Usage

### Use as npm package

```javascript
import { getUsbIds } from 'usb.ids'

// Get USB device data
const usbData = await getUsbIds()
console.log(usbData)
```

### Direct access to data files

The project provides the following data files:

- `usb.ids` - Raw format USB device data
- `usb.ids.json` - JSON format USB device data
- `usb.ids.version.json` - Version information and statistics

## 🌐 Online Viewing

Visit [GitHub Pages](https://drswith.github.io/usb.ids/) to view the USB device database online.

## 🤖 Automation Process

### Data Update Workflow

1. **Scheduled Trigger**: Automatically executes daily at UTC 0:00
2. **Data Fetching**: Fetches the latest USB.IDS data from official sources
3. **Change Detection**: Detects data updates through content hash
4. **Version Generation**: Generates new version numbers based on timestamps
5. **Build & Publish**: Automatically builds and publishes to npm
6. **GitHub Release**: Creates GitHub release versions
7. **Pages Deployment**: Updates GitHub Pages website

### Data Sources

- Primary source: http://www.linux-usb.org/usb.ids
- Fallback source: https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids

## 📊 Data Format

### JSON Format Example

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

### Version Information Format

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

## 🛠️ Development

### Requirements

- Node.js >= 16
- pnpm (recommended)

### Local Development

```bash
# Clone the project
git clone https://github.com/Drswith/usb.ids.git
cd usb.ids

# Install dependencies
pnpm install

# Fetch latest data
pnpm run fetch-usb-ids

# Start development server
pnpm run dev

# Build project
pnpm run build

# Run tests
pnpm run test
```

### Script Commands

- `pnpm run fetch-usb-ids` - Fetch the latest USB.IDS data
- `pnpm run version-info` - Generate version information
- `pnpm run check-update` - Check for updates
- `pnpm run dev` - Start development server
- `pnpm run build` - Build project
- `pnpm run test` - Run tests

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📞 Support

- [GitHub Issues](https://github.com/Drswith/usb.ids/issues)
- [GitHub Sponsors](https://github.com/sponsors/Drswith)

## 🔗 Related Links

- [npm package](https://www.npmjs.com/package/usb.ids)
- [GitHub repository](https://github.com/Drswith/usb.ids)
- [Online viewing](https://drswith.github.io/usb.ids/)
- [USB.IDS official website](http://www.linux-usb.org/usb.ids)
