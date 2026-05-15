import type { VersionInfo } from "@usb-ids/sdk/browser";

interface LegacyFields {
  releaseVersion?: string;
  version?: string;
  upstreamVersion?: string;
  upstreamDate?: string | null;
  upstreamHash?: string;
  contentHash?: string;
  buildTime?: number;
  fetchTime?: number;
  buildTimeFormatted?: string;
  fetchTimeFormatted?: string;
  sourceUrl?: string;
  vendorCount?: number;
  deviceCount?: number;
}

export function normalizeVersionInfoForUi(raw: unknown): VersionInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as LegacyFields;

  const releaseVersion =
    typeof r.releaseVersion === "string"
      ? r.releaseVersion
      : typeof r.version === "string"
        ? r.version
        : "";
  if (!releaseVersion) return null;

  const upstreamHash =
    typeof r.upstreamHash === "string"
      ? r.upstreamHash
      : typeof r.contentHash === "string"
        ? r.contentHash
        : "";
  if (!upstreamHash) return null;

  const upstreamVersion = typeof r.upstreamVersion === "string" ? r.upstreamVersion : "";
  const buildTime =
    typeof r.buildTime === "number"
      ? r.buildTime
      : typeof r.fetchTime === "number"
        ? r.fetchTime
        : 0;
  const buildTimeFormatted =
    typeof r.buildTimeFormatted === "string"
      ? r.buildTimeFormatted
      : typeof r.fetchTimeFormatted === "string"
        ? r.fetchTimeFormatted
        : "";

  return {
    releaseVersion,
    upstreamVersion,
    upstreamDate: typeof r.upstreamDate === "string" ? r.upstreamDate : null,
    upstreamHash,
    buildTime,
    buildTimeFormatted,
    sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : "",
    vendorCount: typeof r.vendorCount === "number" ? r.vendorCount : 0,
    deviceCount: typeof r.deviceCount === "number" ? r.deviceCount : 0,
    schemaVersion: 2,
  };
}
