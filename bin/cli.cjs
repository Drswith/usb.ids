#!/usr/bin/env node
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
const node_fs = __toESM(require("node:fs"));
const node_path = __toESM(require("node:path"));
const node_process = __toESM(require("node:process"));
const node_http = __toESM(require("node:http"));
const node_https = __toESM(require("node:https"));
const node_crypto = __toESM(require("node:crypto"));

//#region src/config.ts
const USB_IDS_SOURCE = ["http://www.linux-usb.org/usb.ids", "https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids"];

//#endregion
//#region src/fetcher.ts
/**
* 远程数据获取模块
* 专门负责从远程URL下载数据
*/
/**
* 下载文件
* @param url 要下载的URL
* @returns Promise<string> 下载的文件内容
*/
function downloadFile(url) {
	return new Promise((resolve, reject) => {
		const client = url.startsWith("https") ? node_https : node_http;
		client.get(`${url}?_t=${Date.now()}`, (res) => {
			if (res.statusCode !== 200) {
				reject(/* @__PURE__ */ new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
				return;
			}
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				resolve(data);
			});
		}).on("error", reject);
	});
}
/**
* 从多个URL尝试下载数据
* @param urls URL列表
* @returns Promise<string> 成功下载的内容
*/
async function downloadFromUrls(urls) {
	let lastError = null;
	for (const url of urls) try {
		const content = await downloadFile(url);
		return content;
	} catch (error) {
		lastError = error;
		console.warn(`Failed to download from ${url}:`, error);
	}
	throw lastError || /* @__PURE__ */ new Error("All download attempts failed");
}

//#endregion
//#region src/parser.ts
/**
* 数据解析模块
* 专门负责将原始数据解析为JSON格式
*/
/**
* 解析usb.ids文件格式并转换为项目所需的JSON格式
* @param content usb.ids文件的原始内容
* @returns UsbIdsData 解析后的JSON数据
*/
function parseUsbIds(content) {
	const lines = content.split("\n");
	const result = {};
	let currentVendor = null;
	for (const line of lines) {
		if (line.startsWith("#") || line.trim() === "") continue;
		if (!line.startsWith("	")) {
			const match = line.match(/^([0-9a-f]{4})\s(.+)$/i);
			if (match) {
				const [, vendorId, vendorName] = match;
				currentVendor = vendorId.toLowerCase();
				result[currentVendor] = {
					vendor: currentVendor,
					name: vendorName.trim(),
					devices: {}
				};
			}
		} else if (line.startsWith("	") && !line.startsWith("		") && currentVendor) {
			const match = line.match(/^\t([0-9a-f]{4})\s(.+)$/i);
			if (match) {
				const [, deviceId, deviceName] = match;
				const deviceIdLower = deviceId.toLowerCase();
				result[currentVendor].devices[deviceIdLower] = {
					devid: deviceIdLower,
					devname: deviceName.trim()
				};
			}
		}
	}
	return result;
}
/**
* 生成内容的SHA256哈希值
* @param content 要计算哈希的内容
* @returns string SHA256哈希值
*/
function generateContentHash(content) {
	return node_crypto.createHash("sha256").update(content).digest("hex");
}
/**
* 格式化时间戳为可读格式
* @param timestamp 时间戳
* @returns string 格式化后的时间字符串
*/
function formatDateTime(timestamp) {
	return new Date(timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
}
/**
* 创建版本信息
* @param data 解析后的USB数据
* @param rawContent 原始内容
* @param source 数据源
* @returns VersionInfo 版本信息对象
*/
function createVersionInfo(data, rawContent, source) {
	const fetchTime = Date.now();
	const contentHash = generateContentHash(rawContent);
	const vendorCount = Object.keys(data).length;
	let deviceCount = 0;
	for (const vendor of Object.values(data)) deviceCount += Object.keys(vendor.devices).length;
	return {
		fetchTime,
		fetchTimeFormatted: formatDateTime(fetchTime),
		contentHash,
		source,
		vendorCount,
		deviceCount,
		version: `v1.0.${fetchTime}`
	};
}
/**
* 判断是否需要更新数据
* @param versionInfo 当前版本信息
* @param forceUpdate 是否强制更新
* @returns boolean 是否需要更新
*/
function shouldUpdate(versionInfo, forceUpdate = false) {
	if (forceUpdate) return true;
	if (!versionInfo) return true;
	const now = Date.now();
	const timeDiff = now - versionInfo.fetchTime;
	const hoursDiff = timeDiff / (1e3 * 60 * 60);
	return hoursDiff >= 24;
}

//#endregion
//#region src/core.ts
/**
* 保存原始usb.ids文件
*/
async function saveRawUsbIdsFile(content, filePath) {
	try {
		node_fs.writeFileSync(filePath, content, "utf8");
	} catch (error) {
		throw new Error(`保存原始USB设备数据失败: ${error.message}`);
	}
}
/**
* 获取USB设备数据
*/
async function fetchUsbIdsData(usbIdsUrls, fallbackFile, root, forceUpdate = false) {
	const versionFilePath = node_path.resolve(root, "usb.ids.version.json");
	try {
		const existingVersion = loadVersionInfo(versionFilePath);
		if (!shouldUpdate(existingVersion, forceUpdate)) {
			const fallbackPath = node_path.resolve(root, fallbackFile);
			if (node_fs.existsSync(fallbackPath)) {
				const data$1 = JSON.parse(node_fs.readFileSync(fallbackPath, "utf8"));
				return {
					data: data$1,
					source: "fallback",
					versionInfo: existingVersion
				};
			}
		}
		let usbIdsContent = null;
		try {
			usbIdsContent = await downloadFromUrls(usbIdsUrls);
		} catch {
			usbIdsContent = null;
		}
		let data;
		let source;
		let rawContent;
		if (usbIdsContent) {
			if (existingVersion && !forceUpdate) {
				const newHash = generateContentHash(usbIdsContent);
				if (newHash === existingVersion.contentHash) {
					const fallbackPath = node_path.resolve(root, fallbackFile);
					if (node_fs.existsSync(fallbackPath)) {
						const data$1 = JSON.parse(node_fs.readFileSync(fallbackPath, "utf8"));
						return {
							data: data$1,
							source: "fallback",
							versionInfo: existingVersion
						};
					}
				}
			}
			const rawFilePath = node_path.resolve(root, "usb.ids");
			await saveRawUsbIdsFile(usbIdsContent, rawFilePath);
			data = parseUsbIds(usbIdsContent);
			source = "api";
			rawContent = usbIdsContent;
		} else {
			const fallbackPath = node_path.resolve(root, fallbackFile);
			if (node_fs.existsSync(fallbackPath)) {
				data = JSON.parse(node_fs.readFileSync(fallbackPath, "utf8"));
				source = "fallback";
				rawContent = JSON.stringify(data);
			} else throw new Error("无法获取USB设备数据，本地fallback文件也不存在");
		}
		const versionInfo = createVersionInfo(data, rawContent, source);
		await saveVersionInfo(versionInfo, versionFilePath);
		return {
			data,
			source,
			versionInfo
		};
	} catch (error) {
		throw new Error(`获取USB设备数据失败: ${error.message}`);
	}
}
/**
* 保存USB设备数据到JSON文件
*/
async function saveUsbIdsToFile(data, filePath) {
	try {
		const jsonContent = JSON.stringify(data, null, 2);
		node_fs.writeFileSync(filePath, jsonContent, "utf8");
	} catch (error) {
		throw new Error(`保存USB设备数据失败: ${error.message}`);
	}
}
/**
* 保存版本信息到文件
*/
async function saveVersionInfo(versionInfo, filePath) {
	try {
		const jsonContent = JSON.stringify(versionInfo, null, 2);
		node_fs.writeFileSync(filePath, jsonContent, "utf8");
	} catch (error) {
		throw new Error(`保存版本信息失败: ${error.message}`);
	}
}
/**
* 读取版本信息
*/
function loadVersionInfo(filePath) {
	try {
		if (!node_fs.existsSync(filePath)) return null;
		const content = node_fs.readFileSync(filePath, "utf8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

//#endregion
//#region src/utils.ts
/**
* ANSI 颜色代码
*/
const colors = {
	reset: "\x1B[0m",
	cyan: "\x1B[36m",
	green: "\x1B[32m",
	blue: "\x1B[34m",
	yellow: "\x1B[33m",
	red: "\x1B[31m"
};
/**
* 格式化时间戳
*/
function formatTimestamp() {
	const now = /* @__PURE__ */ new Date();
	const hours = now.getHours().toString().padStart(2, "0");
	const minutes = now.getMinutes().toString().padStart(2, "0");
	const seconds = now.getSeconds().toString().padStart(2, "0");
	return `${hours}:${minutes}:${seconds}`;
}
/**
* 手动实现的日志函数
*/
function createLogger(level) {
	return (message, verbose = true) => {
		if (!verbose) return;
		const timestamp = formatTimestamp();
		const prefix = `[usb.ids]`;
		switch (level) {
			case "start":
				console.log(`${colors.cyan}◐${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`);
				break;
			case "success":
				console.log(`${colors.green}✔${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`);
				break;
			case "info":
				console.log(`${colors.blue}ℹ${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`);
				break;
			case "warn":
				console.log(`${colors.yellow}⚠${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`);
				break;
			case "error":
				console.log(`${colors.red}✖${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`);
				break;
		}
	};
}
const logger = {
	start: createLogger("start"),
	success: createLogger("success"),
	info: createLogger("info"),
	warn: createLogger("warn"),
	error: createLogger("error")
};

//#endregion
//#region src/cli.ts
/**
* 主要的数据更新函数
*/
async function updateUsbIdsData(forceUpdate = false) {
	try {
		const root = node_process.cwd();
		const fallbackFile = node_path.join(root, "usb.ids");
		const jsonFile = node_path.join(root, "usb.ids.json");
		const versionFile = node_path.join(root, "usb.ids.version.json");
		logger.start("开始更新USB设备数据...");
		const currentVersionInfo = loadVersionInfo(versionFile);
		if (!forceUpdate && !shouldUpdate(currentVersionInfo, forceUpdate)) {
			logger.info("数据仍然是最新的，无需更新");
			return;
		}
		logger.info("正在获取USB设备数据...");
		const { data, source, versionInfo } = await fetchUsbIdsData(USB_IDS_SOURCE, fallbackFile, root, forceUpdate);
		logger.info("正在保存JSON格式数据...");
		await saveUsbIdsToFile(data, jsonFile);
		if (source === "api") logger.info("正在保存原始usb.ids文件...");
		logger.info("正在保存版本信息...");
		await saveVersionInfo(versionInfo, versionFile);
		logger.success(`数据更新完成！`);
		logger.info(`数据源: ${source === "api" ? "远程API" : "本地fallback文件"}`);
		logger.info(`供应商数量: ${versionInfo.vendorCount}`);
		logger.info(`设备数量: ${versionInfo.deviceCount}`);
		logger.info(`版本: ${versionInfo.version}`);
		logger.info(`更新时间: ${versionInfo.fetchTimeFormatted}`);
	} catch (error) {
		logger.error(`更新失败: ${error.message}`);
		node_process.exit(1);
	}
}
/**
* 显示当前版本信息
*/
function showVersionInfo() {
	try {
		const root = node_process.cwd();
		const versionFile = node_path.join(root, "usb.ids.version.json");
		if (!node_fs.existsSync(versionFile)) {
			logger.warn("版本信息文件不存在，请先运行更新命令");
			return;
		}
		const versionInfo = loadVersionInfo(versionFile);
		if (!versionInfo) {
			logger.error("无法读取版本信息");
			return;
		}
		logger.info("当前版本信息:");
		console.log(`  版本: ${versionInfo.version}`);
		console.log(`  数据源: ${versionInfo.source === "api" ? "远程API" : "本地fallback文件"}`);
		console.log(`  供应商数量: ${versionInfo.vendorCount}`);
		console.log(`  设备数量: ${versionInfo.deviceCount}`);
		console.log(`  更新时间: ${versionInfo.fetchTimeFormatted}`);
		console.log(`  内容哈希: ${versionInfo.contentHash}`);
	} catch (error) {
		logger.error(`获取版本信息失败: ${error.message}`);
	}
}
/**
* 检查是否需要更新
*/
function checkUpdate() {
	try {
		const root = node_process.cwd();
		const versionFile = node_path.join(root, "usb.ids.version.json");
		const versionInfo = loadVersionInfo(versionFile);
		const needsUpdate = shouldUpdate(versionInfo);
		if (needsUpdate) {
			logger.warn("数据需要更新");
			if (versionInfo) {
				const hoursSinceUpdate = (Date.now() - versionInfo.fetchTime) / (1e3 * 60 * 60);
				logger.info(`距离上次更新已过去 ${hoursSinceUpdate.toFixed(1)} 小时`);
			} else logger.info("未找到版本信息，建议进行首次更新");
		} else {
			logger.success("数据是最新的，无需更新");
			if (versionInfo) logger.info(`上次更新时间: ${versionInfo.fetchTimeFormatted}`);
		}
	} catch (error) {
		logger.error(`检查更新失败: ${error.message}`);
	}
}
/**
* 显示帮助信息
*/
function showHelp() {
	console.log(`
USB设备数据管理工具

用法:
  usb-ids <command> [options]
  或者: node bin/cli.js <command> [options]

命令:
  update, fetch    更新USB设备数据
  version, info    显示当前版本信息
  check           检查是否需要更新
  help            显示此帮助信息

选项:
  --force         强制更新（忽略时间检查）

示例:
  usb-ids update
  usb-ids update --force
  usb-ids version
  usb-ids check
`);
}
/**
* CLI主函数 - 处理命令行参数
*/
async function runCli() {
	const args = node_process.argv.slice(2);
	const command = args[0];
	switch (command) {
		case "update":
		case "fetch":
			await updateUsbIdsData(args.includes("--force"));
			break;
		case "version":
		case "info":
			showVersionInfo();
			break;
		case "check":
			checkUpdate();
			break;
		case "help":
		case "--help":
		case "-h":
			showHelp();
			break;
		default:
			if (!command) await updateUsbIdsData();
			else {
				logger.error(`未知命令: ${command}`);
				logger.info("使用 --help 查看可用命令");
				node_process.exit(1);
			}
			break;
	}
}
if (require("url").pathToFileURL(__filename).href === `file://${node_process.argv[1]}`) runCli().catch((error) => {
	logger.error(`CLI执行失败: ${error.message}`);
	node_process.exit(1);
});

//#endregion
exports.checkUpdate = checkUpdate;
exports.runCli = runCli;
exports.showHelp = showHelp;
exports.showVersionInfo = showVersionInfo;
exports.updateUsbIdsData = updateUsbIdsData;