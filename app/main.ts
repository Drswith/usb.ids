import type { UsbDatasetV2, UsbIdsData, VersionInfo } from '../src/types'
import type { DeviceResult } from './search'
import type { ThemeMode } from './theme'
import type { VirtualListHandle } from './virtual-list'
import { isDatasetV2, toV1 } from '../src/legacy/to-v1'
import { loadUsbIdsJson, loadVersionJson } from './data-source'
import { createDeviceCardElement } from './render/device-card'
import { searchUsbData } from './search'
import { initTheme, toggleTheme } from './theme'
import { getUrlParams, updateUrlParams } from './url-router'
import { debounce } from './utils'
import { attachVirtualList } from './virtual-list'
import './styles.css'

const ROW_HEIGHT_PX = 180

if (import.meta.env?.DEV)
  document.title = `[DEV] ${document.title}`

let currentData: UsbIdsData = {}
let currentResults: DeviceResult[] = []
let currentPageSlice: DeviceResult[] = []
let currentPage = 1
let itemsPerPage = 50
let versionInfo: VersionInfo | null = null
let themeMode: ThemeMode = 'dark'
let virtualList: VirtualListHandle | null = null

let elements: {
  searchInput: HTMLInputElement
  clearSearch: HTMLButtonElement
  headerTotalVendors: HTMLElement
  headerTotalDevices: HTMLElement
  searchAnnounce: HTMLElement
  themeToggle: HTMLButtonElement
  loadingState: HTMLElement
  emptyState: HTMLElement
  resultsList: HTMLElement
  resultsInner: HTMLElement
  pagination: HTMLElement
  prevPage: HTMLButtonElement
  nextPage: HTMLButtonElement
  pageInfo: HTMLElement
  pageSizeSelect: HTMLSelectElement
  pageJumpInput: HTMLInputElement
  pageJumpBtn: HTMLButtonElement
  versionNumber: HTMLElement
  upstreamVersion: HTMLElement
  fetchTime: HTMLElement
}

function announceSearch(total: number, page: number, pageSize: number): void {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)
  elements.searchAnnounce.textContent = total === 0
    ? 'No matching USB devices.'
    : `Showing ${start} to ${end} of ${total} matches. Page ${page} of ${pages}.`
}

function updatePagination(totalItems: number, currentPageNum: number): void {
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalPages <= 1) {
    elements.pagination.style.display = 'none'
    return
  }

  elements.pagination.style.display = 'flex'
  elements.pageInfo.textContent = `Page ${currentPageNum} of ${totalPages}`

  elements.prevPage.disabled = currentPageNum <= 1
  elements.nextPage.disabled = currentPageNum >= totalPages

  elements.pageJumpInput.value = currentPageNum.toString()
  elements.pageJumpInput.max = totalPages.toString()
}

function showEmptyState(): void {
  if (virtualList) {
    virtualList.destroy()
    virtualList = null
  }
  elements.resultsList.style.display = 'none'
  elements.emptyState.style.display = 'flex'
  elements.pagination.style.display = 'none'
}

function hideLoadingState(): void {
  elements.loadingState.style.display = 'none'
}

function renderResults(results: DeviceResult[], page: number = 1): void {
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  currentPageSlice = results.slice(startIndex, endIndex)

  if (currentPageSlice.length === 0) {
    announceSearch(results.length, page, itemsPerPage)
    showEmptyState()
    return
  }

  const query = elements.searchInput.value.trim()

  if (virtualList) {
    virtualList.destroy()
    virtualList = null
  }

  elements.resultsList.style.display = 'block'
  elements.emptyState.style.display = 'none'

  virtualList = attachVirtualList({
    scrollEl: elements.resultsList,
    innerEl: elements.resultsInner,
    itemHeight: ROW_HEIGHT_PX,
    getCount: () => currentPageSlice.length,
    renderItem: i => createDeviceCardElement(currentPageSlice[i]!, query),
  })
  virtualList.scrollToTop()
  virtualList.refresh()

  updatePagination(results.length, page)
  announceSearch(results.length, page, itemsPerPage)
}

function updateStats(): void {
  const vendorCount = Object.keys(currentData).length
  const deviceCount = Object.values(currentData).reduce(
    (total, vendor) => total + Object.keys(vendor.devices || {}).length,
    0,
  )
  elements.headerTotalVendors.textContent = vendorCount.toLocaleString()
  elements.headerTotalDevices.textContent = deviceCount.toLocaleString()
}

async function loadVersionInfo(): Promise<void> {
  try {
    versionInfo = await loadVersionJson<VersionInfo>()
    updateVersionDisplay()
  }
  catch (error) {
    console.warn('Failed to load version info:', error)
  }
}

function updateVersionDisplay(): void {
  if (!versionInfo)
    return
  elements.versionNumber.textContent = versionInfo?.releaseVersion?.startsWith('v')
    ? versionInfo.releaseVersion
    : `v${versionInfo.releaseVersion}`

  elements.upstreamVersion.textContent = versionInfo.upstreamVersion

  const fetchDate = new Date(versionInfo.buildTime)
  createTimeTooltip(elements.fetchTime, fetchDate, 'Last Updated')
}

function createTimeTooltip(element: HTMLElement, date: Date, label: string): void {
  element.replaceChildren()
  element.removeAttribute('title')

  const container = document.createElement('div')
  container.className = 'tooltip-container'

  const timeSpan = document.createElement('span')
  timeSpan.textContent = date.toLocaleString()

  const tooltip = document.createElement('div')
  tooltip.className = 'tooltip tooltip-utc'

  const tooltipContent = document.createElement('div')
  tooltipContent.className = 'tooltip-content'

  const tooltipLabel = document.createElement('div')
  tooltipLabel.className = 'tooltip-label'
  tooltipLabel.textContent = `${label} (UTC)`

  const tooltipTime = document.createElement('div')
  tooltipTime.className = 'tooltip-time'
  tooltipTime.textContent = date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')

  tooltipContent.append(tooltipLabel, tooltipTime)
  tooltip.appendChild(tooltipContent)

  container.append(timeSpan, tooltip)
  element.appendChild(container)
}

function handleSearch(): void {
  const query = elements.searchInput.value.trim()
  elements.clearSearch.style.display = query ? 'block' : 'none'

  currentResults = searchUsbData(currentData, { query })
  currentPage = 1

  updateUrlParams(query, currentPage, itemsPerPage)
  updateStats()
  renderResults(currentResults, currentPage)
}

function clearSearch(): void {
  elements.searchInput.value = ''
  elements.clearSearch.style.display = 'none'
  handleSearch()
}

function changePage(direction: 'prev' | 'next'): void {
  if (direction === 'prev' && currentPage > 1) {
    currentPage--
  }
  else if (direction === 'next') {
    const totalPages = Math.ceil(currentResults.length / itemsPerPage)
    if (currentPage < totalPages)
      currentPage++
  }

  const query = elements.searchInput.value.trim()
  updateUrlParams(query, currentPage, itemsPerPage)
  elements.pageJumpInput.value = currentPage.toString()
  renderResults(currentResults, currentPage)
}

function handlePageSizeChange(): void {
  itemsPerPage = Number.parseInt(elements.pageSizeSelect.value, 10)
  const totalPages = Math.ceil(currentResults.length / itemsPerPage)
  if (currentPage > totalPages)
    currentPage = Math.max(1, totalPages)

  const query = elements.searchInput.value.trim()
  updateUrlParams(query, currentPage, itemsPerPage)
  elements.pageJumpInput.value = currentPage.toString()
  renderResults(currentResults, currentPage)
}

function handlePageJump(): void {
  const targetPage = Number.parseInt(elements.pageJumpInput.value, 10)
  const totalPages = Math.ceil(currentResults.length / itemsPerPage)

  if (targetPage >= 1 && targetPage <= totalPages) {
    currentPage = targetPage
    const query = elements.searchInput.value.trim()
    updateUrlParams(query, currentPage, itemsPerPage)
    renderResults(currentResults, currentPage)
  }
  else {
    elements.pageJumpInput.value = currentPage.toString()
  }
}

const debouncedSearch = debounce(handleSearch, 300)

async function initializeApp(): Promise<void> {
  try {
    themeMode = initTheme()

    elements = {
      searchInput: document.getElementById('searchInput') as HTMLInputElement,
      clearSearch: document.getElementById('clearSearch') as HTMLButtonElement,
      headerTotalVendors: document.getElementById('headerTotalVendors') as HTMLElement,
      headerTotalDevices: document.getElementById('headerTotalDevices') as HTMLElement,
      searchAnnounce: document.getElementById('searchAnnounce') as HTMLElement,
      themeToggle: document.getElementById('themeToggle') as HTMLButtonElement,
      loadingState: document.getElementById('loadingState') as HTMLElement,
      emptyState: document.getElementById('emptyState') as HTMLElement,
      resultsList: document.getElementById('resultsList') as HTMLElement,
      resultsInner: document.getElementById('resultsVirtualInner') as HTMLElement,
      pagination: document.getElementById('pagination') as HTMLElement,
      prevPage: document.getElementById('prevPage') as HTMLButtonElement,
      nextPage: document.getElementById('nextPage') as HTMLButtonElement,
      pageInfo: document.getElementById('pageInfo') as HTMLElement,
      pageSizeSelect: document.getElementById('pageSizeSelect') as HTMLSelectElement,
      pageJumpInput: document.getElementById('pageJumpInput') as HTMLInputElement,
      pageJumpBtn: document.getElementById('pageJumpBtn') as HTMLButtonElement,
      versionNumber: document.getElementById('versionNumber') as HTMLElement,
      upstreamVersion: document.getElementById('upstreamVersion') as HTMLElement,
      fetchTime: document.getElementById('fetchTime') as HTMLElement,
    }

    elements.themeToggle.setAttribute('aria-pressed', themeMode === 'dark' ? 'true' : 'false')
    elements.themeToggle.addEventListener('click', () => {
      themeMode = toggleTheme(themeMode)
      elements.themeToggle.setAttribute('aria-pressed', themeMode === 'dark' ? 'true' : 'false')
      elements.themeToggle.textContent = themeMode === 'dark' ? 'Light mode' : 'Dark mode'
    })
    elements.themeToggle.textContent = themeMode === 'dark' ? 'Light mode' : 'Dark mode'

    const usbIdsRaw = await loadUsbIdsJson<UsbIdsData | UsbDatasetV2>()
    const usbIdsData = isDatasetV2(usbIdsRaw) ? toV1(usbIdsRaw) : usbIdsRaw
    currentData = usbIdsData

    await loadVersionInfo()

    const urlParams = getUrlParams()
    if (urlParams.query) {
      elements.searchInput.value = urlParams.query
      elements.clearSearch.style.display = 'block'
    }
    currentPage = urlParams.page

    handleSearch()
    hideLoadingState()
  }
  catch (error) {
    console.error('Failed to load USB ID\'s data:', error)
    hideLoadingState()
    showEmptyState()
  }

  elements.searchInput.addEventListener('input', debouncedSearch)
  elements.clearSearch.addEventListener('click', clearSearch)
  elements.prevPage.addEventListener('click', () => changePage('prev'))
  elements.nextPage.addEventListener('click', () => changePage('next'))
  elements.pageSizeSelect.addEventListener('change', handlePageSizeChange)
  elements.pageJumpBtn.addEventListener('click', handlePageJump)
  elements.pageJumpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handlePageJump()
    }
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch()
    }
    else if (e.key === '/' && e.target !== elements.searchInput) {
      e.preventDefault()
      elements.searchInput.focus()
    }
  })
}

if (globalThis.window) {
  const copyrightYear = document.getElementById('copyrightYear')
  if (copyrightYear)
    copyrightYear.textContent = new Date().getFullYear().toString()

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', initializeApp)
  else
    initializeApp()
}
