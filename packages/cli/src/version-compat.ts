import { createRequire } from "node:module";
import type { VersionInfo } from "../../sdk/src/types";

const require = createRequire(import.meta.url);
const versionManifest = require("../usb.ids.version.json") as VersionInfo;

export const version = versionManifest;
