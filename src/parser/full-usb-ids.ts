/* eslint-disable regexp/no-super-linear-backtracking -- line-based usb.ids parsing; inputs are trusted registry files */
import type {
  UsbClassEntry,
  UsbDatasetV2,
  UsbDeviceV2,
  UsbSubclassEntry,
  UsbVendorV2,
} from "../types";

type ParseMode =
  | "vendors"
  | "classes"
  | "audio-terminals"
  | "hid-descriptors"
  | "hid-items"
  | "bias"
  | "phy"
  | "hut"
  | "languages"
  | "hid-country"
  | "video-terminals";

function leadingTabs(s: string): number {
  let n = 0;
  while (n < s.length && s[n] === "\t") n++;
  return n;
}

function advanceMajorSection(line: string, mode: ParseMode): ParseMode {
  const t = line.trimStart();
  if (t.startsWith("#") || t === "") return mode;

  switch (mode) {
    case "vendors":
      if (/^C [0-9a-f]{2}\s/i.test(line)) return "classes";
      return mode;
    case "classes":
      if (/^AT /i.test(line)) return "audio-terminals";
      return mode;
    case "audio-terminals":
      if (/^HID /i.test(line)) return "hid-descriptors";
      return mode;
    case "hid-descriptors":
      if (/^R /i.test(line)) return "hid-items";
      return mode;
    case "hid-items":
      if (/^BIAS /i.test(line)) return "bias";
      return mode;
    case "bias":
      if (/^PHY /i.test(line)) return "phy";
      return mode;
    case "phy":
      if (/^HUT /i.test(line)) return "hut";
      return mode;
    case "hut":
      if (/^L [0-9a-f]{4}\s/i.test(line)) return "languages";
      return mode;
    case "languages":
      if (/^HCC /i.test(line)) return "hid-country";
      return mode;
    case "hid-country":
      if (/^VT /i.test(line)) return "video-terminals";
      return mode;
    default:
      return mode;
  }
}

/**
 * Full usb.ids parse: vendors/devices/subsystems, USB classes, HID pages, languages, etc.
 */
export function parseUsbIdsFull(content: string): UsbDatasetV2 {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");

  const dataset: UsbDatasetV2 = {
    schemaVersion: 2,
    vendors: {},
    classes: {},
    audioTerminals: {},
    hidDescriptors: {},
    hidItemTypes: {},
    biasTypes: {},
    phyTypes: {},
    hidUsagePages: {},
    languages: {},
    hidCountryCodes: {},
    videoTerminals: {},
    hcts: {},
  };

  let mode: ParseMode = "vendors";
  let currentVendor: string | null = null;
  let currentDevice: string | null = null;

  let currentClassCode: string | null = null;
  let currentSubclassCode: string | null = null;

  let currentHutPage: string | null = null;

  let currentLangCode: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;

    mode = advanceMajorSection(line, mode);

    const tabs = leadingTabs(line);

    switch (mode) {
      case "vendors": {
        if (tabs === 0) {
          const m = line.match(/^([0-9a-f]{4})\s+(.+)$/i);
          if (m) {
            const [, vid, name] = m;
            currentVendor = vid.toLowerCase();
            currentDevice = null;
            const v: UsbVendorV2 = {
              vendor: currentVendor,
              name: name.trim(),
              devices: {},
            };
            dataset.vendors[currentVendor] = v;
          }
        } else if (tabs === 1 && currentVendor) {
          const m = line.match(/^\t([0-9a-f]{4})\s+(.+)$/i);
          if (m) {
            const [, did, dname] = m;
            const id = did.toLowerCase();
            currentDevice = id;
            const dev: UsbDeviceV2 = { devid: id, devname: dname.trim() };
            dataset.vendors[currentVendor].devices[id] = dev;
          }
        } else if (tabs === 2 && currentVendor && currentDevice) {
          const m = line.match(/^\t\t([0-9a-f]{4})\s+([0-9a-f]{4})\s+(.+)$/i);
          if (m) {
            const [, sv, sd, sname] = m;
            const dev = dataset.vendors[currentVendor].devices[currentDevice];
            if (dev) {
              if (!dev.subsystems) dev.subsystems = [];
              dev.subsystems.push({
                subvendor: sv.toLowerCase(),
                subdevice: sd.toLowerCase(),
                name: sname.trim(),
              });
            }
          }
        }
        break;
      }
      case "classes": {
        if (tabs === 0) {
          const m = line.match(/^C ([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, cc, cname] = m;
            currentClassCode = cc.toLowerCase();
            currentSubclassCode = null;
            const centry: UsbClassEntry = {
              code: currentClassCode,
              name: cname.trim(),
              subclasses: {},
            };
            dataset.classes[currentClassCode] = centry;
          }
        } else if (tabs === 1 && currentClassCode) {
          const m = line.match(/^\t([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, sc, sname] = m;
            currentSubclassCode = sc.toLowerCase();
            const scEntry: UsbSubclassEntry = {
              code: currentSubclassCode,
              name: sname.trim(),
              protocols: {},
            };
            dataset.classes[currentClassCode].subclasses[currentSubclassCode] = scEntry;
          }
        } else if (tabs === 2 && currentClassCode && currentSubclassCode) {
          const m = line.match(/^\t\t([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, pc, pname] = m;
            const prot = pc.toLowerCase();
            dataset.classes[currentClassCode].subclasses[currentSubclassCode].protocols[prot] = {
              code: prot,
              name: pname.trim(),
            };
          }
        }
        break;
      }
      case "audio-terminals": {
        const m = line.match(/^AT ([0-9a-f]{4})\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.audioTerminals[id.toLowerCase()] = name.trim();
        }
        break;
      }
      case "hid-descriptors": {
        const m = line.match(/^HID ([0-9a-f]{2})\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.hidDescriptors[id.toLowerCase()] = name.trim();
        }
        break;
      }
      case "hid-items": {
        const m = line.match(/^R ([0-9a-f]{2})\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.hidItemTypes[id.toLowerCase()] = name.trim();
        }
        break;
      }
      case "bias": {
        const m = line.match(/^BIAS ([0-9a-f]+)\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.biasTypes[id] = name.trim();
        }
        break;
      }
      case "phy": {
        const m = line.match(/^PHY ([0-9a-f]{2})\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.phyTypes[id.toLowerCase()] = name.trim();
        }
        break;
      }
      case "hut": {
        if (tabs === 0) {
          const m = line.match(/^HUT ([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, pid, pname] = m;
            currentHutPage = pid.toLowerCase();
            dataset.hidUsagePages[currentHutPage] = {
              pageCode: currentHutPage,
              name: pname.trim(),
              usages: {},
            };
          }
        } else if (tabs === 1 && currentHutPage) {
          const m = line.match(/^\t([0-9a-f]{1,4})\s+(.+)$/i);
          if (m) {
            const [, uid, uname] = m;
            dataset.hidUsagePages[currentHutPage].usages[uid.toLowerCase()] = uname.trim();
          }
        }
        break;
      }
      case "languages": {
        if (tabs === 0) {
          const m = line.match(/^L ([0-9a-f]{4})\s+(.+)$/i);
          if (m) {
            const [, lid, lname] = m;
            currentLangCode = lid.toLowerCase();
            dataset.languages[currentLangCode] = { name: lname.trim() };
          }
        } else if (tabs === 1 && currentLangCode) {
          const m = line.match(/^\t([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, did, dname] = m;
            const lang = dataset.languages[currentLangCode];
            if (lang) {
              if (!lang.dialects) lang.dialects = {};
              lang.dialects[did.toLowerCase()] = dname.trim();
            }
          }
        }
        break;
      }
      case "hid-country": {
        const m = line.match(/^HCC ([0-9a-f]{2})\s+(.+)$/i);
        if (m) {
          const [, id, name] = m;
          dataset.hidCountryCodes[id.toLowerCase()] = name.trim();
        }
        break;
      }
      case "video-terminals": {
        if (/^HCT /i.test(line)) {
          const m = line.match(/^HCT ([0-9a-f]{2})\s+(.+)$/i);
          if (m) {
            const [, id, name] = m;
            dataset.hcts[id.toLowerCase()] = name.trim();
          }
        } else {
          const m = line.match(/^VT ([0-9a-f]{4})\s+(.+)$/i);
          if (m) {
            const [, id, name] = m;
            dataset.videoTerminals[id.toLowerCase()] = name.trim();
          }
        }
        break;
      }
    }
  }

  return dataset;
}
