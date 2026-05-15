#!/usr/bin/env tsx

/**
 * USB.IDS data hash diff for CI: compare remote `usb.ids` SHA-256 with the latest published
 * `usb.ids.version.json` on the npm CDN (`upstreamHash`, legacy `contentHash`).
 */

import * as process from "node:process";
import { USB_IDS_SOURCE } from "../src/config";
import { downloadFromUrls } from "../src/fetcher";
import { generateContentHash } from "../src/parser";
import { logger } from "../src/utils";

interface NpmVersionInfo {
  upstreamHash?: string;
  contentHash?: string;
  releaseVersion?: string;
  version?: string;
  fetchTime?: number;
}

function publishedHash(info: NpmVersionInfo): string | undefined {
  return info.upstreamHash ?? info.contentHash;
}

function publishedRelease(info: NpmVersionInfo): string | undefined {
  return info.releaseVersion ?? info.version;
}

/**
 * 获取npm包中的版本信息
 */
async function getNpmVersionInfo(): Promise<NpmVersionInfo | null> {
  try {
    const versionUrl = "https://unpkg.com/usb.ids@latest/usb.ids.version.json";
    const response = await fetch(versionUrl);

    if (!response.ok) {
      logger.warn(`Failed to fetch version info from unpkg: ${response.status}`);
      return null;
    }

    const versionInfo = (await response.json()) as NpmVersionInfo;
    logger.info(`NPM package release: ${publishedRelease(versionInfo) ?? "unknown"}`);
    return versionInfo;
  } catch (error) {
    logger.warn(`Error fetching npm version info: ${(error as Error).message}`);
    return null;
  }
}

/**
 * 获取远程数据的 SHA-256
 */
async function getRemoteContentHash(): Promise<string | null> {
  try {
    logger.info("Downloading remote USB.IDS data...");
    const content = await downloadFromUrls(USB_IDS_SOURCE);

    if (!content) {
      logger.warn("Failed to download remote USB.IDS data");
      return null;
    }

    const hash = generateContentHash(content);
    logger.info(`Remote content hash: ${hash}`);
    return hash;
  } catch (error) {
    logger.warn(`Error downloading remote data: ${(error as Error).message}`);
    return null;
  }
}

/**
 * 主函数：比较哈希差异
 */
async function diffHash(): Promise<void> {
  try {
    logger.start("Comparing content hashes...");

    const npmInfo = await getNpmVersionInfo();
    if (!npmInfo) {
      logger.info("No npm version info available, forcing update");
      process.exit(1);
    }

    const npmHash = publishedHash(npmInfo);
    if (!npmHash) {
      logger.info("No upstreamHash/contentHash in npm manifest, forcing update");
      process.exit(1);
    }

    logger.info(`NPM package hash: ${npmHash}`);

    const remoteHash = await getRemoteContentHash();
    if (!remoteHash) {
      logger.info("Failed to get remote hash, forcing update");
      process.exit(1);
    }

    if (remoteHash === npmHash) {
      logger.success("No difference found, content hash is the same");
      process.exit(0);
    } else {
      logger.info("Hash difference detected");
      logger.info(`Remote: ${remoteHash}`);
      logger.info(`NPM:    ${npmHash}`);
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Hash comparison failed: ${(error as Error).message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  diffHash();
}

export { diffHash };
