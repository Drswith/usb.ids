#!/usr/bin/env node
import * as fs from "node:fs";
import { createServer } from "node:http";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import sirv from "sirv";
import { config, fetchUsbIdsData, loadVersionInfo, saveUsbIdsToFile } from "@usb-ids/sdk";

const EXIT_CODES = {
  SUCCESS: 0,
  USAGE: 2,
  DATA_MISSING: 3,
  NETWORK: 4,
  PARSE: 5,
  FILESYSTEM: 6,
} as const;

function stdout(message: string): void {
  process.stdout.write(`${message}\n`);
}

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

function jsonStdout(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function classifyError(error: unknown): number {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (
    msg.includes("unable to fetch") ||
    msg.includes("download") ||
    msg.includes("network") ||
    msg.includes("http ")
  ) {
    return EXIT_CODES.NETWORK;
  }
  if (
    msg.includes("parse") ||
    msg.includes("json") ||
    msg.includes("invalid") ||
    msg.includes("resolve upstream version")
  ) {
    return EXIT_CODES.PARSE;
  }
  if (
    msg.includes("save") ||
    msg.includes("write") ||
    msg.includes("read") ||
    msg.includes("enoent") ||
    msg.includes("eacces")
  ) {
    return EXIT_CODES.FILESYSTEM;
  }
  return EXIT_CODES.DATA_MISSING;
}

function getCliPackageRoot(): string {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  return path.dirname(cliDir);
}

function resolveUiDistDir(): string {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  const fromDistSibling = path.join(cliDir, "ui");
  if (fs.existsSync(fromDistSibling)) return path.resolve(fromDistSibling);
  const fromRepo = path.join(path.dirname(cliDir), "dist", "ui");
  if (fs.existsSync(fromRepo)) return path.resolve(fromRepo);
  return path.resolve(fromDistSibling);
}

async function updateUsbIdsData(
  options: { forceUpdate?: boolean; offline?: boolean } = {},
): Promise<number> {
  try {
    const forceUpdate = options.forceUpdate ?? false;
    const offline = options.offline ?? false;
    const root = process.cwd();
    const fallbackFile = config.USB_IDS_JSON_FILE;
    const jsonFile = path.join(root, config.USB_IDS_JSON_FILE);
    const sources = offline ? [] : config.USB_IDS_SOURCE;

    const { data, source, versionInfo } = await fetchUsbIdsData(
      sources,
      fallbackFile,
      root,
      forceUpdate,
    );

    await saveUsbIdsToFile(data, jsonFile);

    stdout("Data update completed");
    stdout(`Data source: ${source === "api" ? "Remote API" : "Local fallback file"}`);
    stdout(`Vendor count: ${versionInfo.vendorCount}`);
    stdout(`Device count: ${versionInfo.deviceCount}`);
    stdout(`Release: ${versionInfo.releaseVersion}`);
    stdout(`Upstream database: ${versionInfo.upstreamVersion}`);
    stdout(`Build time: ${versionInfo.buildTimeFormatted}`);
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    stderr(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    return classifyError(error);
  }
}

function showVersionInfo(asJson: boolean): number {
  try {
    const root = process.cwd();
    const versionFile = path.join(root, config.USB_IDS_VERSION_JSON_FILE);

    if (!fs.existsSync(versionFile)) {
      const message = "Version info file does not exist, please run `usb-ids fetch` first";
      if (asJson) jsonStdout({ ok: false, code: "DATA_MISSING", message });
      else stderr(message);
      return EXIT_CODES.DATA_MISSING;
    }

    const versionInfo = loadVersionInfo(versionFile);
    if (!versionInfo) {
      const message = "Unable to read version information";
      if (asJson) jsonStdout({ ok: false, code: "PARSE_ERROR", message });
      else stderr(message);
      return EXIT_CODES.PARSE;
    }

    if (asJson) {
      jsonStdout({ ok: true, version: versionInfo });
    } else {
      stdout("Current version information:");
      stdout(`  Release: ${versionInfo.releaseVersion}`);
      stdout(`  Upstream database: ${versionInfo.upstreamVersion}`);
      stdout(`  Vendor count: ${versionInfo.vendorCount}`);
      stdout(`  Device count: ${versionInfo.deviceCount}`);
      stdout(`  Build time: ${versionInfo.buildTimeFormatted}`);
      stdout(`  Upstream hash: ${versionInfo.upstreamHash}`);
    }
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = `Failed to get version information: ${error instanceof Error ? error.message : String(error)}`;
    if (asJson) jsonStdout({ ok: false, code: "FILESYSTEM_ERROR", message });
    else stderr(message);
    return EXIT_CODES.FILESYSTEM;
  }
}

function checkUpdate(asJson: boolean): number {
  try {
    const root = process.cwd();
    const versionFile = path.join(root, config.USB_IDS_VERSION_JSON_FILE);
    const versionInfo = loadVersionInfo(versionFile);

    if (!versionInfo) {
      const message = "Version manifest missing — run `usb-ids fetch` first";
      if (asJson) jsonStdout({ ok: false, code: "DATA_MISSING", message });
      else stderr(message);
      return EXIT_CODES.DATA_MISSING;
    }
    const payload = {
      ok: true,
      status: "manifest_present",
      needsUpdateCheck: true,
      version: versionInfo,
    };
    if (asJson) {
      jsonStdout(payload);
    } else {
      stdout("Local manifest (run fetch to refresh from network)");
      stdout(`Upstream database: ${versionInfo.upstreamVersion}`);
      stdout(`Release: ${versionInfo.releaseVersion}`);
      stdout(`Build time: ${versionInfo.buildTimeFormatted}`);
    }
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = `Check update failed: ${error instanceof Error ? error.message : String(error)}`;
    if (asJson) jsonStdout({ ok: false, code: "FILESYSTEM_ERROR", message });
    else stderr(message);
    return EXIT_CODES.FILESYSTEM;
  }
}

/**
 * 启动静态web服务器
 */
async function startWebServer(port = 3000): Promise<number> {
  try {
    const distDir = resolveUiDistDir();
    const pkgRoot = path.resolve(getCliPackageRoot());
    const distDirResolved = path.resolve(distDir);

    if (!fs.existsSync(distDirResolved)) {
      stderr(
        "dist/ui directory does not exist, please run build command first: pnpm run build:app",
      );
      return EXIT_CODES.FILESYSTEM;
    }

    function isPathInsideDir(file: string, dir: string): boolean {
      const rel = path.relative(dir, file);
      return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    }

    function logResp(statusCode: number, start: number): void {
      stdout(`HTTP Returned ${statusCode} in ${Date.now() - start} ms`);
    }

    const prod = process.env.NODE_ENV === "production";
    const serveStatic = sirv(distDirResolved, {
      etag: true,
      single: true,
      dev: !prod,
      maxAge: prod ? 86_400_000 : 0,
      immutable: prod,
    });

    const server = createServer((req, res) => {
      const startTime = Date.now();
      const rawUrl = req.url ?? "/";
      stdout(`HTTP ${req.method} ${rawUrl}`);

      let urlPath: string;
      try {
        urlPath = decodeURIComponent(rawUrl.split("?")[0] || "/");
      } catch {
        res.writeHead(400);
        res.end("Bad Request");
        logResp(400, startTime);
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405);
        res.end("Method Not Allowed");
        logResp(405, startTime);
        return;
      }

      if (urlPath === "/" || urlPath === "") {
        res.writeHead(302, { Location: config.UI_LOCAL_BASE_URL });
        res.end();
        logResp(302, startTime);
        return;
      }

      const rel =
        urlPath === config.UI_LOCAL_BASE_URL
          ? "index.html"
          : urlPath.startsWith(config.UI_LOCAL_BASE_URL)
            ? urlPath.slice(config.UI_LOCAL_BASE_URL.length) || "index.html"
            : urlPath.replace(/^\//, "");

      const base = path.basename(rel.split("?")[0] ?? rel);
      if (base === config.USB_IDS_JSON_FILE || base === config.USB_IDS_VERSION_JSON_FILE) {
        const dataPath = path.resolve(pkgRoot, base);
        if (!isPathInsideDir(dataPath, pkgRoot)) {
          res.writeHead(403);
          res.end("Forbidden");
          logResp(403, startTime);
          return;
        }
        fs.readFile(dataPath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end("Not Found");
            logResp(404, startTime);
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          if (req.method === "HEAD") {
            res.end();
          } else {
            res.end(data);
          }
          logResp(200, startTime);
        });
        return;
      }

      if (!urlPath.startsWith(config.UI_LOCAL_BASE_URL)) {
        res.writeHead(404);
        res.end("Not Found");
        logResp(404, startTime);
        return;
      }

      let inner = urlPath.slice(config.UI_LOCAL_BASE_URL.length);
      if (!inner || inner === "/") inner = "/";
      else if (!inner.startsWith("/")) inner = `/${inner}`;

      const qs = rawUrl.includes("?") ? `?${rawUrl.split("?").slice(1).join("?")}` : "";
      const prevUrl = req.url;
      (req as { url?: string }).url = `${inner}${qs}`;

      serveStatic(req, res, () => {
        (req as { url?: string }).url = prevUrl;
        res.statusCode = 404;
        res.end("Not Found");
        logResp(404, startTime);
      });
    });

    server.listen(port, () => {
      stdout("usb.ids Web UI server started");
      stdout(`Access URL: http://localhost:${port}${config.UI_LOCAL_BASE_URL}`);
      stdout("Press Control+C to stop the server");
    });

    return new Promise<void>((resolve, reject) => {
      server.on("error", (error) => {
        stderr(`Server error: ${error.message}`);
        reject(error);
      });
      server.on("close", () => {
        stdout("Server stopped");
        resolve();
      });
    }).then(() => EXIT_CODES.SUCCESS);
  } catch (error) {
    stderr(`Failed to start web server: ${error instanceof Error ? error.message : String(error)}`);
    return EXIT_CODES.FILESYSTEM;
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  stdout(`
USB Device Data Management Tool

Usage:
  usb-ids <command> [options]
  or: node bin/cli.js <command> [options]

Commands:
  update, fetch    Update USB ID's data
  version, info    Show current version information
  check           Check if update is needed
  ui              Start web interface server
  help            Show this help information

Options:
  --force         Force update (ignore time check)
  --offline       Skip network fetch and only use local fallback data
  --json          Output machine-readable JSON (version/check)
  --port <port>   Specify web server port (default 3000)

Examples:
  usb-ids update
  usb-ids update --force
  usb-ids version
  usb-ids check
  usb-ids ui
  usb-ids ui --port 8080
`);
}

/**
 * CLI主函数 - 处理命令行参数
 */
async function runCli(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const asJson = args.includes("--json");
  let exitCode: number = EXIT_CODES.SUCCESS;

  switch (command) {
    case "update":
    case "fetch":
      exitCode = await updateUsbIdsData({
        forceUpdate: args.includes("--force"),
        offline: args.includes("--offline"),
      });
      break;

    case "version":
    case "info":
      exitCode = showVersionInfo(asJson);
      break;

    case "check":
      exitCode = checkUpdate(asJson);
      break;

    case "ui": {
      // 解析端口参数
      const portIndex = args.indexOf("--port");
      let port = 3000;
      if (portIndex !== -1 && args[portIndex + 1]) {
        const parsedPort = Number.parseInt(args[portIndex + 1], 10);
        if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort < 65536) {
          port = parsedPort;
        } else {
          stderr("Invalid port number, using default port 3000");
        }
      }
      exitCode = await startWebServer(port);
      break;
    }

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    default:
      if (!command) {
        exitCode = await updateUsbIdsData();
      } else {
        stderr(`Unknown command: ${command}`);
        stderr("Use --help to see available commands");
        exitCode = EXIT_CODES.USAGE;
      }
      break;
  }
  process.exitCode = exitCode;
}

runCli().catch((error) => {
  stderr(`CLI execution failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = classifyError(error);
});
