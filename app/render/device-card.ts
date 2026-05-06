import type { DeviceResult } from '../search'
import { appendHighlighted } from '../dom-safe'

export function createDeviceCardElement(result: DeviceResult, query: string): HTMLElement {
  const { device, vendor, matchType } = result
  const card = document.createElement('article')
  card.className = `device-card match-${matchType}`
  card.setAttribute('role', 'listitem')
  card.dataset.deviceId = device.devid
  card.dataset.vendorId = vendor.vendor

  const header = document.createElement('div')
  header.className = 'device-header'
  const deviceInfo = document.createElement('div')
  deviceInfo.className = 'device-info'

  const idSection = document.createElement('div')
  idSection.className = 'device-id-section'
  const idLabel = document.createElement('span')
  idLabel.className = 'id-label'
  idLabel.textContent = 'Device ID:'
  const deviceIdSpan = document.createElement('span')
  deviceIdSpan.className = 'device-id'
  appendHighlighted(deviceIdSpan, device.devid, query)
  idSection.append(idLabel, deviceIdSpan)

  const deviceName = document.createElement('div')
  deviceName.className = 'device-name'
  appendHighlighted(deviceName, device.devname, query)

  deviceInfo.append(idSection, deviceName)
  header.appendChild(deviceInfo)
  card.appendChild(header)

  const vendorInfo = document.createElement('div')
  vendorInfo.className = 'vendor-info'
  const vendorDetails = document.createElement('div')
  vendorDetails.className = 'vendor-details'

  const vendorLabel = document.createElement('span')
  vendorLabel.className = 'id-label'
  vendorLabel.textContent = 'Vendor:'
  const vendorIdSpan = document.createElement('span')
  vendorIdSpan.className = 'vendor-id'
  appendHighlighted(vendorIdSpan, vendor.vendor, query)
  const vendorNameSpan = document.createElement('span')
  vendorNameSpan.className = 'vendor-name'
  appendHighlighted(vendorNameSpan, vendor.name, query)

  vendorDetails.append(vendorLabel, vendorIdSpan, vendorNameSpan)
  vendorInfo.appendChild(vendorDetails)
  card.appendChild(vendorInfo)

  return card
}
