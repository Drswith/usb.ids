import type { UsbIdsData } from "../types";
import * as fs from "node:fs";
import * as path from "node:path";
import { USB_IDS_JSON_FILE, USB_IDS_SOURCE } from "../config";
import { fetchUsbIdsData } from "../core";
import { isDatasetV2, toV1 } from "../legacy/to-v1";
import { getPackageRoot } from "../paths";

export interface SdkDataSourceOptions {
  rootDir?: string;
  /** Optional directory containing usb.ids data artifacts (alias of rootDir). */
  dataDir?: string;
  dataFile?: string;
  fallbackFile?: string;
  upstreamUrls?: string[];
}

export interface ResolvedSdkDataSource {
  rootDir: string;
  dataFile: string;
  fallbackFile: string;
  upstreamUrls: string[];
}

/**
 * Resolve a concrete data source; callers can inject `rootDir`/`dataDir` to avoid path coupling.
 */
export function resolveSdkDataSource(options: SdkDataSourceOptions = {}): ResolvedSdkDataSource {
  const envRoot = process.env.USB_IDS_DATA_ROOT;
  const rootDir = options.rootDir ?? options.dataDir ?? envRoot ?? getPackageRoot();
  return {
    rootDir,
    dataFile: options.dataFile ?? USB_IDS_JSON_FILE,
    fallbackFile: options.fallbackFile ?? options.dataFile ?? USB_IDS_JSON_FILE,
    upstreamUrls: options.upstreamUrls ?? USB_IDS_SOURCE,
  };
}

export function loadUsbDataSync(options: SdkDataSourceOptions = {}): UsbIdsData {
  const source = resolveSdkDataSource(options);
  const p = path.join(source.rootDir, source.dataFile);
  if (!fs.existsSync(p)) {
    throw new Error(
      `Missing ${source.dataFile} under configured root (${source.rootDir}). Run \`usb-ids fetch\` or provide a valid SDK data source.`,
    );
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  if (isDatasetV2(raw)) return toV1(raw);
  return raw as UsbIdsData;
}

export async function loadUsbData(options: SdkDataSourceOptions = {}): Promise<UsbIdsData> {
  return loadUsbDataSync(options);
}

export async function updateUsbData(
  options: SdkDataSourceOptions & { force?: boolean } = {},
): Promise<Awaited<ReturnType<typeof fetchUsbIdsData>>> {
  const source = resolveSdkDataSource(options);
  return fetchUsbIdsData(
    source.upstreamUrls,
    source.fallbackFile,
    source.rootDir,
    options.force ?? false,
  );
}
