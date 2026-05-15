import { createRequire } from "node:module";
import type { VersionInfo } from "@usb-ids/sdk";

const require = createRequire(import.meta.url);
const versionManifest = require("../usb.ids.version.json") as VersionInfo;

export const version = versionManifest;
