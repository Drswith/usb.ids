/**
 * CalVer: `schemaMajor.YYYYMMDD.N` — N increments for multiple releases with the same upstream YMD.
 * YMD is derived from upstream `# Version: YYYY.MM.DD` (dots collapsed to YYYYMMDD).
 */
export function nextCalVer(opts: {
  /** Upstream dotted date string `YYYY.MM.DD` */
  upstreamVersion: string;
  /** Current `releaseVersion` from package.json / last manifest */
  currentReleaseVersion: string;
  /** Must match first segment of CalVer and `VersionInfo.schemaVersion` */
  schemaMajor: number;
}): string {
  const { upstreamVersion, currentReleaseVersion, schemaMajor } = opts;

  const parts = upstreamVersion.split(".");
  if (parts.length !== 3)
    throw new Error(`Invalid upstreamVersion (expected YYYY.MM.DD): ${upstreamVersion}`);

  const ymd = `${parts[0]}${parts[1]}${parts[2]}`;
  const cal = new RegExp(`^${schemaMajor}\\.(\\d{8})\\.(\\d+)$`);
  const m = currentReleaseVersion.match(cal);
  if (m?.[1] === ymd) return `${schemaMajor}.${ymd}.${Number(m[2]) + 1}`;
  return `${schemaMajor}.${ymd}.0`;
}
