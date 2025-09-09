# usb.ids

<div align="center">

[![npm version](https://img.shields.io/npm/v/usb.ids)](https://www.npmjs.com/package/usb.ids) [![npm downloads](https://img.shields.io/npm/dm/usb.ids)](https://www.npmjs.com/package/usb.ids)

[![Last Updated](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2Fusb.ids%2Fusb.ids.version.json&query=%24.fetchTimeFormatted&label=latest%20release&color=blue)](https://www.npmjs.com/package/usb.ids) [![Auto Update](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/auto-update.yml?label=auto%20update)](https://github.com/Drswith/usb.ids/actions/workflows/auto-update.yml) [![GitHub Pages](https://img.shields.io/github/actions/workflow/status/Drswith/usb.ids/github-pages.yml?label=github%20pages)](https://github.com/Drswith/usb.ids/actions/workflows/github-pages.yml)

</div>

An automated USB ID's database project that provides a CLI tool and data files. It fetches the latest USB ID's data every 24 hours and publishes updated data files to npm.

## 🚀 Features

- **CLI Tool**: Command-line interface for managing USB ID's data
- **Modern API Library**: Async-first API with TypeScript support and pure function tools
- **Auto Update**: Automatically checks and fetches the latest USB ID's data every 24 hours with smart content comparison
- **Multi-format Support**: Provides both raw format and JSON format data files
- **Web Interface**: Built-in web server for browsing and searching USB ID's data
- **npm Distribution**: Distributes data files through npm package manager
- **GitHub Pages**: Provides online viewing interface
- **Version Management**: Smart version control based on content hash with optimized update detection
- **Data Statistics**: Provides vendor and device count statistics
- **Environment Compatibility**: Works in both Node.js and browser environments
- **Advanced Filtering**: Support for string, function, and object-based filtering
- **Smart Search**: Intelligent search with relevance scoring and priority ranking

## 📦 Installation

### As a CLI Tool

```bash
npm install -g usb.ids
# or
pnpm add -g usb.ids
# or
yarn global add usb.ids
```

### As a Data Package

```bash
npm install usb.ids
# or
pnpm add usb.ids
# or
yarn add usb.ids
```

## 🔧 Usage

### CLI Commands

```bash
# Update USB ID's data
usb-ids fetch

# Force update USB ID's data
usb-ids fetch --force

# Show version information
usb-ids version

# Check for updates
usb-ids check

# Start web interface (default port: 3000)
usb-ids ui

# Start web interface on custom port
usb-ids ui --port 8080

# Show help
usb-ids help
```

### Using the API Library

The package provides a modern async API for accessing USB ID's data:

```javascript
import {
  filterDevices,
  filterVendors,
  getDevice,
  getDevices,
  getUsbData,
  getVendor,
  getVendors,
  searchDevices,
  searchInData
} from 'usb.ids'

// Get all vendors
const allVendors = await getVendors()

// Get vendors with filter
const appleVendors = await getVendors('Apple')
const specificVendor = await getVendor('05ac')

// Get devices for a vendor
const appleDevices = await getDevices('05ac')
const filteredDevices = await getDevices('05ac', 'iPhone')

// Get a specific device
const device = await getDevice('05ac', '12a8')

// Search devices across all vendors
const searchResults = await searchDevices('iPhone')

// Get complete USB data
const usbData = await getUsbData()

// Pure function tools for processing existing data
const filteredVendors = filterVendors(usbData, 'Apple')
const searchResults2 = searchInData(usbData, 'mouse')
```

#### Filter Options

Filters can be strings, functions, or objects:

```javascript
// String filter (searches in names and IDs)
const vendors1 = await getVendors('Apple')

// Function filter
const vendors2 = await getVendors(vendor => vendor.name.includes('Tech'))

// Object filter
const vendors3 = await getVendors({
  id: '05ac',
  name: 'Apple',
  search: 'apple' // searches in both name and ID
})

// Device filters work similarly
const devices1 = await getDevices('05ac', 'iPhone')
const devices2 = await getDevices('05ac', device => device.devname.includes('Pro'))
const devices3 = await getDevices('05ac', {
  id: '12a8',
  name: 'iPhone',
  search: 'phone'
})
```

#### Force Update

All async functions accept an optional `forceUpdate` parameter:

```javascript
// Force fetch fresh data from remote source
const vendors = await getVendors(null, true)
const device = await getDevice('05ac', '12a8', true)
```

### Direct access to data files

The project provides the following data files:

- `usb.ids` - Raw format USB ID's data
- `usb.ids.json` - JSON format USB ID's data
- `usb.ids.version.json` - Version information and statistics

## 🌐 Online Viewing

Visit [GitHub Pages](https://drswith.github.io/usb.ids/) to view the USB ID's database online.

## 🤖 Automation Process

### Data Update Workflow

1. **Scheduled Trigger**: Automatically executes daily at UTC 0:00
2. **Version Check**: Compares remote data content hash with the latest published npm package
   - Downloads remote USB ID's data without saving
   - Calculates content hash of remote data
   - Compares with content hash from latest npm package version
   - Only proceeds if content has actually changed
3. **Data Fetching**: Fetches and saves the latest USB ID's data (only when update needed)
4. **Change Detection**: Smart detection prevents unnecessary updates and builds
5. **Version Generation**: Generates new version numbers based on timestamps
6. **Build & Publish**: Automatically builds and publishes to npm
7. **GitHub Release**: Creates GitHub release versions
8. **Pages Deployment**: Updates GitHub Pages website

### Scheduling Details

- **Execution Time**: Daily at UTC 0:00 (00:00)
- **Timezone**: UTC (Coordinated Universal Time)
- **Frequency**: Once per day
- **Timeout**: Maximum 30 minutes per execution
- **Smart Updates**: Only executes full workflow when data actually changes
- **Execution Precision**: Based on GitHub Actions scheduled workflows, timing precision may vary and execution may be delayed

> **Smart Version Checking Strategy**
> The workflow now uses an optimized version checking strategy that compares content hashes before processing. This prevents unnecessary builds and publishes when the upstream data hasn't changed, significantly reducing CI/CD resource usage and avoiding version pollution.

### Data Sources

- Primary source: http://www.linux-usb.org/usb.ids
- Fallback source: https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids

## 📊 Data Format

### JSON Format Example

```json
{
  "1d6b": {
    "vendor": "1d6b",
    "name": "Linux Foundation",
    "devices": {
      "0001": {
        "devid": "0001",
        "devname": "1.1 root hub"
      },
      "0002": {
        "devid": "0002",
        "devname": "2.0 root hub"
      }
    }
  },
  "05ac": {
    "vendor": "05ac",
    "name": "Apple, Inc.",
    "devices": {
      "12a8": {
        "devid": "12a8",
        "devname": "iPhone 5/5C/5S/6/SE/7/8/X"
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

- Node.js >= 18
- pnpm

### Local Development

```bash
# Clone the project
git clone https://github.com/Drswith/usb.ids.git
cd usb.ids

# Install dependencies
pnpm install

# Fetch latest data
pnpm run fetch-usb-ids

# Develop Lib
pnpm run dev:lib

# Develop Web UI
pnpm run dev:app

# Build Project
pnpm run build

# Run tests
pnpm run test
```

### Script Commands

- `pnpm run fetch-usb-ids` - Fetch the latest USB ID's data
- `pnpm run dev:app` - Start web app development server
- `pnpm run build:app` - Build web application
- `pnpm run dev:lib` - Start library development with watch mode
- `pnpm run build:lib` - Build library
- `pnpm run build` - Build both library and web application
- `pnpm run dev:ui` - Start web UI server (equivalent to `usb-ids ui`)
- `pnpm run test` - Run tests
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run lint` - Run linter
- `pnpm run lint:fix` - Run linter with auto-fix
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run release` - Build and publish to npm

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
- [USB ID's official website](http://www.linux-usb.org/usb.ids)
