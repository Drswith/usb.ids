#!/usr/bin/env node
import * as fs from "node:fs";
import { createServer } from "node:http";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, CommanderError } from "commander";
import pc from "picocolors";
import prompts from "prompts";
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

type ExitCode = (typeof EXIT_CODES)[keyof typeof EXIT_CODES];

type FetchCommandOptions = {
  force?: boolean;
  offline?: boolean;
  yes?: boolean;
  interactive?: boolean;
};

type UiCommandOptions = {
  port?: string;
};

function stdout(message: string): void {
  process.stdout.write(`${message}\n`);
}

function stderr(message: string): void {
  process.stderr.write(`${message}\n`);
}

function jsonStdout(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

function info(message: string): void {
  stdout(pc.cyan(message));
}

function success(message: string): void {
  stdout(pc.green(message));
}

function warn(message: string): void {
  stderr(pc.yellow(message));
}

function errorOut(message: string): void {
  stderr(pc.red(message));
}

function classifyError(error: unknown): ExitCode {
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

function parsePortOrDefault(input: string | undefined): number {
  if (!input) return 3000;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isNaN(parsed) && parsed > 0 && parsed < 65536) return parsed;
  warn("Invalid port number, using default port 3000");
  return 3000;
}

async function shouldContinueForceFetch(options: FetchCommandOptions): Promise<boolean> {
  if (!options.force) return true;
  if (options.yes) return true;
  if (!options.interactive) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) return true;

  const response = await prompts({
    type: "confirm",
    name: "confirmed",
    message: "Force refresh from network and overwrite local artifacts?",
    initial: false,
  });
  return Boolean(response.confirmed);
}

async function updateUsbIdsData(options: FetchCommandOptions = {}): Promise<ExitCode> {
  try {
    const canProceed = await shouldContinueForceFetch(options);
    if (!canProceed) {
      warn("Operation cancelled");
      return EXIT_CODES.USAGE;
    }

    const forceUpdate = options.force ?? false;
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

    success("Data update completed");
    info(`Data source: ${source === "api" ? "Remote API" : "Local fallback file"}`);
    info(`Vendor count: ${versionInfo.vendorCount}`);
    info(`Device count: ${versionInfo.deviceCount}`);
    info(`Release: ${versionInfo.releaseVersion}`);
    info(`Upstream database: ${versionInfo.upstreamVersion}`);
    info(`Build time: ${versionInfo.buildTimeFormatted}`);
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    errorOut(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
    return classifyError(error);
  }
}

function showVersionInfo(asJson: boolean): ExitCode {
  try {
    const root = process.cwd();
    const versionFile = path.join(root, config.USB_IDS_VERSION_JSON_FILE);

    if (!fs.existsSync(versionFile)) {
      const message = "Version info file does not exist, please run `usb-ids fetch` first";
      if (asJson) jsonStdout({ ok: false, code: "DATA_MISSING", message });
      else errorOut(message);
      return EXIT_CODES.DATA_MISSING;
    }

    const versionInfo = loadVersionInfo(versionFile);
    if (!versionInfo) {
      const message = "Unable to read version information";
      if (asJson) jsonStdout({ ok: false, code: "PARSE_ERROR", message });
      else errorOut(message);
      return EXIT_CODES.PARSE;
    }

    if (asJson) {
      jsonStdout({ ok: true, version: versionInfo });
    } else {
      info("Current version information:");
      info(`  Release: ${versionInfo.releaseVersion}`);
      info(`  Upstream database: ${versionInfo.upstreamVersion}`);
      info(`  Vendor count: ${versionInfo.vendorCount}`);
      info(`  Device count: ${versionInfo.deviceCount}`);
      info(`  Build time: ${versionInfo.buildTimeFormatted}`);
      info(`  Upstream hash: ${versionInfo.upstreamHash}`);
    }
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = `Failed to get version information: ${error instanceof Error ? error.message : String(error)}`;
    if (asJson) jsonStdout({ ok: false, code: "FILESYSTEM_ERROR", message });
    else errorOut(message);
    return EXIT_CODES.FILESYSTEM;
  }
}

function checkUpdate(asJson: boolean): ExitCode {
  try {
    const root = process.cwd();
    const versionFile = path.join(root, config.USB_IDS_VERSION_JSON_FILE);
    const versionInfo = loadVersionInfo(versionFile);

    if (!versionInfo) {
      const message = "Version manifest missing — run `usb-ids fetch` first";
      if (asJson) jsonStdout({ ok: false, code: "DATA_MISSING", message });
      else errorOut(message);
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
      info("Local manifest (run fetch to refresh from network)");
      info(`Upstream database: ${versionInfo.upstreamVersion}`);
      info(`Release: ${versionInfo.releaseVersion}`);
      info(`Build time: ${versionInfo.buildTimeFormatted}`);
    }
    return EXIT_CODES.SUCCESS;
  } catch (error) {
    const message = `Check update failed: ${error instanceof Error ? error.message : String(error)}`;
    if (asJson) jsonStdout({ ok: false, code: "FILESYSTEM_ERROR", message });
    else errorOut(message);
    return EXIT_CODES.FILESYSTEM;
  }
}

async function startWebServer(port = 3000): Promise<ExitCode> {
  try {
    const distDir = resolveUiDistDir();
    const pkgRoot = path.resolve(getCliPackageRoot());
    const distDirResolved = path.resolve(distDir);

    if (!fs.existsSync(distDirResolved)) {
      errorOut(
        "dist/ui directory does not exist, please run build command first: pnpm run build:app",
      );
      return EXIT_CODES.FILESYSTEM;
    }

    function isPathInsideDir(file: string, dir: string): boolean {
      const rel = path.relative(dir, file);
      return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
    }

    function logResp(statusCode: number, start: number): void {
      stdout(pc.dim(`HTTP Returned ${statusCode} in ${Date.now() - start} ms`));
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
      stdout(pc.dim(`HTTP ${req.method} ${rawUrl}`));

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
      success("usb.ids Web UI server started");
      info(`Access URL: http://localhost:${port}${config.UI_LOCAL_BASE_URL}`);
      info("Press Control+C to stop the server");
    });

    return await new Promise<ExitCode>((resolve, reject) => {
      server.on("error", (error) => {
        errorOut(`Server error: ${error.message}`);
        reject(error);
      });
      server.on("close", () => {
        info("Server stopped");
        resolve(EXIT_CODES.SUCCESS);
      });
    });
  } catch (error) {
    errorOut(
      `Failed to start web server: ${error instanceof Error ? error.message : String(error)}`,
    );
    return EXIT_CODES.FILESYSTEM;
  }
}

function cleanCommanderMessage(message: string): string {
  return message.replace(/^error:\s*/i, "");
}

function unknownCommandFromArgv(argv: string[]): string {
  const first = argv.find((arg) => !arg.startsWith("-"));
  return first ?? "unknown";
}

function buildProgram(setExitCode: (code: ExitCode) => void): Command {
  const program = new Command();
  program
    .name("usb-ids")
    .description("USB Device Data Management Tool")
    .showSuggestionAfterError()
    .showHelpAfterError("Use --help to see available commands")
    .helpCommand(false)
    .exitOverride();

  program.configureOutput({
    outputError: (str, write) => write(pc.red(str)),
  });

  program
    .command("fetch")
    .alias("update")
    .description("Update USB IDs data")
    .option("--force", "Force update (ignore cache/time checks)")
    .option("--offline", "Skip network fetch and only use local fallback data")
    .option("-y, --yes", "Skip interactive confirmation prompts")
    .option("--interactive", "Enable interactive prompts for confirmation")
    .action(async (options: FetchCommandOptions) => {
      setExitCode(await updateUsbIdsData(options));
    });

  program
    .command("version")
    .alias("info")
    .description("Show current version information")
    .option("--json", "Output machine-readable JSON")
    .action((options: { json?: boolean }) => {
      setExitCode(showVersionInfo(Boolean(options.json)));
    });

  program
    .command("check")
    .description("Check local update manifest state")
    .option("--json", "Output machine-readable JSON")
    .action((options: { json?: boolean }) => {
      setExitCode(checkUpdate(Boolean(options.json)));
    });

  program
    .command("ui")
    .description("Start web interface server")
    .option("--port <port>", "Specify web server port (default 3000)")
    .action(async (options: UiCommandOptions) => {
      setExitCode(await startWebServer(parsePortOrDefault(options.port)));
    });

  program
    .command("help")
    .description("Show this help information")
    .action(() => {
      program.outputHelp();
      setExitCode(EXIT_CODES.SUCCESS);
    });

  return program;
}

async function runCli(argv = process.argv.slice(2)): Promise<ExitCode> {
  if (argv.length === 0) {
    return updateUsbIdsData();
  }

  let exitCode: ExitCode = EXIT_CODES.SUCCESS;
  const program = buildProgram((next) => {
    exitCode = next;
  });

  try {
    await program.parseAsync(argv, { from: "user" });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === "commander.helpDisplayed") return EXIT_CODES.SUCCESS;
      if (error.code === "commander.unknownCommand") {
        errorOut(`Unknown command: ${unknownCommandFromArgv(argv)}`);
        stderr("Use --help to see available commands");
        return EXIT_CODES.USAGE;
      }
      errorOut(cleanCommanderMessage(error.message));
      return EXIT_CODES.USAGE;
    }

    errorOut(`CLI execution failed: ${error instanceof Error ? error.message : String(error)}`);
    return classifyError(error);
  }
}

runCli()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error) => {
    errorOut(`CLI execution failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = classifyError(error);
  });
