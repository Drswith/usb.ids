import { UI_LOCAL_BASE_URL, USB_IDS_JSON_FILE, USB_IDS_VERSION_JSON_FILE } from '../src/config'

const PKG_VERSION = typeof import.meta.env.VERSION === 'string' ? import.meta.env.VERSION : 'latest'

export function getDataPackageVersion(): string {
  return PKG_VERSION
}

export function isLocalDataMode(): boolean {
  return import.meta.env.BASE_URL === UI_LOCAL_BASE_URL
}

export async function loadDataFromNpm<T>(pkgVersion: string, file: string): Promise<T> {
  try {
    const response = await fetch(`https://unpkg.com/usb.ids@${pkgVersion}/${file}`)
    if (response.ok)
      return await response.json() as T
    throw new Error(`Failed to fetch from npm CDN: ${response.status}`)
  }
  catch (error) {
    console.warn(`Failed to load USB IDs from npm (@${pkgVersion}), falling back to local:`, error)
    try {
      const fallbackResponse = await fetch(`${import.meta.env.BASE_URL}${file}`)
      if (fallbackResponse.ok)
        return await fallbackResponse.json() as T
    }
    catch (fallbackError) {
      console.error('Failed to load fallback data:', fallbackError)
    }
    return {} as T
  }
}

export async function loadDataFromLocal<T>(file: string): Promise<T> {
  try {
    const response = await fetch(file)
    if (response.ok)
      return await response.json() as T
    throw new Error(`Failed to fetch from local: ${response.status}`)
  }
  catch (error) {
    console.warn('Failed to load local data:', error)
    return {} as T
  }
}

export async function loadUsbIdsJson<T>(): Promise<T> {
  const local = isLocalDataMode()
  return local
    ? loadDataFromLocal<T>(USB_IDS_JSON_FILE)
    : loadDataFromNpm<T>(PKG_VERSION, USB_IDS_JSON_FILE)
}

export async function loadVersionJson<T>(): Promise<T> {
  const local = isLocalDataMode()
  return local
    ? loadDataFromLocal<T>(USB_IDS_VERSION_JSON_FILE)
    : loadDataFromNpm<T>(PKG_VERSION, USB_IDS_VERSION_JSON_FILE)
}
