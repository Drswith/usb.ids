import type { UsbDevice, UsbIdsData, UsbVendor, VersionInfo } from '../src/types'
import { UI_LOCAL_BASE_URL, USB_IDS_JSON_FILE, USB_IDS_VERSION_JSON_FILE } from '../src/config'
import './styles.css'

// 类型定义
interface DeviceResult {
  device: UsbDevice & { devid: string }
  vendor: UsbVendor & { vendor: string }
  matchType: 'vendor' | 'device' | 'both'
}

interface SearchOptions {
  query: string
}

if (import.meta.env?.DEV) {
  // 在网站title添加[DEV]
  document.title = `[DEV] ${document.title}`
}

// 全局变量
const version = 'latest'
const useLocalData = import.meta.env.BASE_URL === UI_LOCAL_BASE_URL

let currentData: UsbIdsData = {}
let currentResults: DeviceResult[] = []
let currentPage = 1
let itemsPerPage = 50
let versionInfo: VersionInfo | null = null

// DOM元素（延迟初始化）
let elements: {
  searchInput: HTMLInputElement
  clearSearch: HTMLButtonElement
  headerTotalVendors: HTMLElement
  headerTotalDevices: HTMLElement

  loadingState: HTMLElement
  emptyState: HTMLElement
  resultsList: HTMLElement
  pagination: HTMLElement
  prevPage: HTMLButtonElement
  nextPage: HTMLButtonElement
  pageInfo: HTMLElement
  pageSizeSelect: HTMLSelectElement
  pageJumpInput: HTMLInputElement
  pageJumpBtn: HTMLButtonElement
  versionNumber: HTMLElement
  fetchTime: HTMLElement
}

// 工具函数
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// URL参数处理函数
function getUrlParams(): { query: string, page: number } {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    query: urlParams.get('q') || '',
    page: Number.parseInt(urlParams.get('pageNum') || '1', 10),
  }
}

function updateUrlParams(query: string, page: number): void {
  const url = new URL(window.location.href)

  if (query) {
    url.searchParams.set('q', query)
  }
  else {
    url.searchParams.delete('q')
  }

  // 始终添加分页参数，包括第一页
  url.searchParams.set('pageSize', itemsPerPage.toString())
  url.searchParams.set('pageNum', page.toString())

  window.history.replaceState({}, '', url.toString())
}

function highlightText(text: string, query: string): string {
  if (!query.trim())
    return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim()
}

// 搜索功能
function searchUsbData(options: SearchOptions): DeviceResult[] {
  const { query } = options
  const normalizedQuery = normalizeText(query)

  const results: DeviceResult[] = []

  Object.entries(currentData).forEach(([vendorId, vendor]) => {
    const vendorIdMatch = normalizeText(vendorId).includes(normalizedQuery)
    const vendorNameMatch = normalizeText(vendor.name).includes(normalizedQuery)

    // 遍历所有设备
    Object.entries(vendor.devices || {}).forEach(([deviceId, device]) => {
      const deviceIdMatch = normalizeText(deviceId).includes(normalizedQuery)
      const deviceNameMatch = normalizeText(device.devname).includes(normalizedQuery)

      let shouldInclude = false
      let matchType: 'vendor' | 'device' | 'both' = 'vendor'

      if (!normalizedQuery) {
        // 无搜索条件时显示所有设备
        shouldInclude = true
        matchType = 'vendor'
      }
      else {
        if ((vendorIdMatch || vendorNameMatch) && (deviceIdMatch || deviceNameMatch)) {
          matchType = 'both'
          shouldInclude = true
        }
        else if (vendorIdMatch || vendorNameMatch) {
          matchType = 'vendor'
          shouldInclude = true
        }
        else if (deviceIdMatch || deviceNameMatch) {
          matchType = 'device'
          shouldInclude = true
        }
      }

      if (shouldInclude) {
        results.push({
          device: { ...device, devid: deviceId },
          vendor: { ...vendor, vendor: vendorId },
          matchType,
        })
      }
    })
  })

  return results
}

// 渲染函数
function renderResults(results: DeviceResult[], page: number = 1): void {
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const pageResults = results.slice(startIndex, endIndex)

  if (pageResults.length === 0) {
    showEmptyState()
    return
  }

  const query = elements.searchInput.value.trim()

  const html = pageResults.map((result) => {
    const { device, vendor, matchType } = result

    const deviceIdHtml = highlightText(device.devid, query)
    const deviceNameHtml = highlightText(device.devname, query)
    const vendorIdHtml = highlightText(vendor.vendor, query)
    const vendorNameHtml = highlightText(vendor.name, query)

    // 根据匹配类型添加样式类
    const matchTypeClass = `match-${matchType}`

    return `
      <div class="device-card ${matchTypeClass}" data-device-id="${device.devid}" data-vendor-id="${vendor.vendor}">
        <div class="device-header">
          <div class="device-info">
            <div class="device-id-section">
              <span class="id-label">Device ID:</span>
              <span class="device-id">${deviceIdHtml}</span>
            </div>
            <div class="device-name">${deviceNameHtml}</div>
          </div>
        </div>
        <div class="vendor-info">
          <div class="vendor-details">
            <span class="id-label">Vendor:</span>
            <span class="vendor-id">${vendorIdHtml}</span>
            <span class="vendor-name">${vendorNameHtml}</span>
          </div>
        </div>
      </div>
    `
  }).join('')

  elements.resultsList.innerHTML = html
  elements.resultsList.style.display = 'block'
  elements.emptyState.style.display = 'none'

  updatePagination(results.length, page)
}

function showEmptyState(): void {
  elements.resultsList.style.display = 'none'
  elements.emptyState.style.display = 'flex'
  elements.pagination.style.display = 'none'
}

function hideLoadingState(): void {
  elements.loadingState.style.display = 'none'
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

  // 更新页码跳转输入框
  elements.pageJumpInput.value = currentPageNum.toString()
  elements.pageJumpInput.max = totalPages.toString()
}

function updateStats(): void {
  const vendorCount = Object.keys(currentData).length
  const deviceCount = Object.values(currentData).reduce((total, vendor) => {
    return total + Object.keys(vendor.devices || {}).length
  }, 0)

  elements.headerTotalVendors.textContent = vendorCount.toLocaleString()
  elements.headerTotalDevices.textContent = deviceCount.toLocaleString()
}

// 远程数据获取
async function loadDataFromNpm<T>(version: string, file: string): Promise<T> {
  try {
    // 从npm CDN获取指定版本的file
    const response = await fetch(`https://unpkg.com/usb.ids@${version}/${file}`)
    if (response.ok) {
      const data = await response.json() as T
      console.log(`Loaded ${file} from npm CDN (version: ${version})`)
      return data
    }
    else {
      throw new Error(`Failed to fetch from npm CDN: ${response.status}`)
    }
  }
  catch (error) {
    console.warn('Failed to load USB ID\'s from npm, falling back to local data:', error)
    // 如果从npm获取失败，尝试加载本地数据作为fallback
    try {
      const fallbackResponse = await fetch(`${import.meta.env.BASE_URL}${file}`)
      if (fallbackResponse.ok) {
        return await fallbackResponse.json() as T
      }
    }
    catch (fallbackError) {
      console.error('Failed to load fallback data:', fallbackError)
    }
    // 如果都失败了，返回空对象
    return {} as T
  }
}

async function loadDataFromLocal<T>(file: string): Promise<T> {
  try {
    const response = await fetch(file)
    if (response.ok) {
      return await response.json() as T
    }
    else {
      throw new Error(`Failed to fetch from local: ${response.status}`)
    }
  }
  catch (error) {
    console.warn('Failed to load local data:', error)
    return {} as T
  }
}

async function loadVersionInfo(): Promise<void> {
  try {
    versionInfo = useLocalData ? await loadDataFromLocal<VersionInfo>(USB_IDS_VERSION_JSON_FILE) : await loadDataFromNpm<VersionInfo>(version, USB_IDS_VERSION_JSON_FILE)
    updateVersionDisplay()
  }
  catch (error) {
    console.warn('Failed to load version info:', error)
  }
}

function updateVersionDisplay(): void {
  if (!versionInfo)
    return

  // 显示版本号（带v前缀）
  elements.versionNumber.textContent = versionInfo?.version?.startsWith('v')
    ? versionInfo.version
    : `v${versionInfo.version}`

  // 显示获取时间（转换为本地时间）
  const fetchDate = new Date(versionInfo.fetchTime)
  createTimeTooltip(elements.fetchTime, fetchDate, 'Last Updated')
}

function createTimeTooltip(element: HTMLElement, date: Date, label: string): void {
  // 清除现有内容
  element.innerHTML = ''
  element.removeAttribute('title')

  // 创建tooltip容器
  const container = document.createElement('div')
  container.className = 'tooltip-container'

  // 创建显示的本地时间
  const timeSpan = document.createElement('span')
  timeSpan.textContent = date.toLocaleString()

  // 创建tooltip
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

  tooltipContent.appendChild(tooltipLabel)
  tooltipContent.appendChild(tooltipTime)
  tooltip.appendChild(tooltipContent)

  container.appendChild(timeSpan)
  container.appendChild(tooltip)

  element.appendChild(container)
}

// 事件处理函数
function handleSearch(): void {
  const query = elements.searchInput.value.trim()

  // 显示/隐藏清除按钮
  elements.clearSearch.style.display = query ? 'block' : 'none'

  // 执行搜索
  currentResults = searchUsbData({ query })
  currentPage = 1

  // 更新URL参数
  updateUrlParams(query, currentPage)

  // 更新统计
  updateStats()

  // 渲染结果
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
    if (currentPage < totalPages) {
      currentPage++
    }
  }

  // 更新URL参数
  const query = elements.searchInput.value.trim()
  updateUrlParams(query, currentPage)

  // 更新页码跳转输入框
  elements.pageJumpInput.value = currentPage.toString()

  renderResults(currentResults, currentPage)
}

function handlePageSizeChange(): void {
  const newPageSize = Number.parseInt(elements.pageSizeSelect.value, 10)
  itemsPerPage = newPageSize

  // 重新计算当前页，确保不超出范围
  const totalPages = Math.ceil(currentResults.length / itemsPerPage)
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages)
  }

  // 更新URL参数
  const query = elements.searchInput.value.trim()
  updateUrlParams(query, currentPage)

  // 更新页码跳转输入框
  elements.pageJumpInput.value = currentPage.toString()

  renderResults(currentResults, currentPage)
}

function handlePageJump(): void {
  const targetPage = Number.parseInt(elements.pageJumpInput.value, 10)
  const totalPages = Math.ceil(currentResults.length / itemsPerPage)

  if (targetPage >= 1 && targetPage <= totalPages) {
    currentPage = targetPage

    // 更新URL参数
    const query = elements.searchInput.value.trim()
    updateUrlParams(query, currentPage)

    renderResults(currentResults, currentPage)
  }
  else {
    // 如果输入的页码无效，重置为当前页
    elements.pageJumpInput.value = currentPage.toString()
  }
}

// 防抖搜索
const debouncedSearch = debounce(handleSearch, 300)

// 初始化应用
async function initializeApp(): Promise<void> {
  try {
    // 初始化DOM元素
    elements = {
      searchInput: document.getElementById('searchInput') as HTMLInputElement,
      clearSearch: document.getElementById('clearSearch') as HTMLButtonElement,

      headerTotalVendors: document.getElementById('headerTotalVendors') as HTMLElement,
      headerTotalDevices: document.getElementById('headerTotalDevices') as HTMLElement,

      loadingState: document.getElementById('loadingState') as HTMLElement,
      emptyState: document.getElementById('emptyState') as HTMLElement,
      resultsList: document.getElementById('resultsList') as HTMLElement,
      pagination: document.getElementById('pagination') as HTMLElement,
      prevPage: document.getElementById('prevPage') as HTMLButtonElement,
      nextPage: document.getElementById('nextPage') as HTMLButtonElement,
      pageInfo: document.getElementById('pageInfo') as HTMLElement,
      pageSizeSelect: document.getElementById('pageSizeSelect') as HTMLSelectElement,
      pageJumpInput: document.getElementById('pageJumpInput') as HTMLInputElement,
      pageJumpBtn: document.getElementById('pageJumpBtn') as HTMLButtonElement,
      versionNumber: document.getElementById('versionNumber') as HTMLElement,
      fetchTime: document.getElementById('fetchTime') as HTMLElement,
    }

    // 异步加载USB ID's数据
    const usbIdsData = useLocalData ? await loadDataFromLocal<UsbIdsData>(USB_IDS_JSON_FILE) : await loadDataFromNpm<UsbIdsData>(version, USB_IDS_JSON_FILE)
    console.log('USB ID\'s Data loaded:', usbIdsData)

    // 设置数据
    currentData = usbIdsData as UsbIdsData

    // 加载版本信息
    await loadVersionInfo()

    // 从URL参数恢复状态
    const urlParams = getUrlParams()
    if (urlParams.query) {
      elements.searchInput.value = urlParams.query
      elements.clearSearch.style.display = 'block'
    }

    // 设置当前页
    currentPage = urlParams.page

    // 初始搜索（显示所有数据或URL参数指定的搜索结果）
    handleSearch()

    // 隐藏加载状态
    hideLoadingState()
  }
  catch (error) {
    console.error('Failed to load USB ID\'s data:', error)
    hideLoadingState()
    showEmptyState()
  }

  // 绑定事件
  elements.searchInput.addEventListener('input', debouncedSearch)
  elements.clearSearch.addEventListener('click', clearSearch)

  elements.prevPage.addEventListener('click', () => changePage('prev'))
  elements.nextPage.addEventListener('click', () => changePage('next'))

  // 分页器新功能事件绑定
  elements.pageSizeSelect.addEventListener('change', handlePageSizeChange)
  elements.pageJumpBtn.addEventListener('click', handlePageJump)
  elements.pageJumpInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handlePageJump()
    }
  })

  // 键盘快捷键
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

// 清理函数，防止内存泄露
function cleanup(): void {
  // 清理函数保留用于未来扩展
}

// 启动应用
if (globalThis.window) {
  // 动态更新版权年份
  const copyrightYear = document.getElementById('copyrightYear')
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear().toString()
  }

  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp)
  }
  else {
    initializeApp()
  }

  // 页面卸载时清理定时器
  window.addEventListener('beforeunload', cleanup)
  window.addEventListener('unload', cleanup)

  // 页面隐藏时暂停定时器，显示时恢复（优化性能）
  // 倒计时功能已移除
}
