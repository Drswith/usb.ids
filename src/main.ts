import type { UsbDevice, UsbIdsData, UsbVendor, VersionInfo } from '../plugins/plugin-usb-ids/typing'
import './styles.css'

// 类型定义
interface DeviceResult {
  device: UsbDevice & { devid: string }
  vendor: UsbVendor & { vendor: string }
  matchType: 'vendor' | 'device' | 'both'
}

interface SearchOptions {
  query: string
  searchType: 'all' | 'vendor' | 'device'
}

// 全局变量
let currentData: UsbIdsData = {}
let currentResults: DeviceResult[] = []
let currentPage = 1
let itemsPerPage = 50
let versionInfo: VersionInfo | null = null
let countdownInterval: NodeJS.Timeout | null = null

// DOM元素（延迟初始化）
let elements: {
  searchInput: HTMLInputElement
  clearSearch: HTMLButtonElement
  searchTypeRadios: NodeListOf<HTMLInputElement>
  headerTotalVendors: HTMLElement
  headerTotalDevices: HTMLElement
  searchResults: HTMLElement
  searchResultsText: HTMLElement
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
  nextUpdate: HTMLElement
  countdown: HTMLElement
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
function getUrlParams(): { query: string, searchType: 'all' | 'vendor' | 'device', page: number } {
  const urlParams = new URLSearchParams(window.location.search)
  return {
    query: urlParams.get('q') || '',
    searchType: (urlParams.get('type') as 'all' | 'vendor' | 'device') || 'all',
    page: Number.parseInt(urlParams.get('pageNum') || '1', 10),
  }
}

function updateUrlParams(query: string, searchType: 'all' | 'vendor' | 'device', page: number): void {
  const url = new URL(window.location.href)

  if (query) {
    url.searchParams.set('q', query)
  }
  else {
    url.searchParams.delete('q')
  }

  if (searchType !== 'all') {
    url.searchParams.set('type', searchType)
  }
  else {
    url.searchParams.delete('type')
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
  const { query, searchType } = options
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
      else if (searchType === 'all') {
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
      else if (searchType === 'vendor') {
        if (vendorIdMatch || vendorNameMatch) {
          matchType = 'vendor'
          shouldInclude = true
        }
      }
      else if (searchType === 'device') {
        if (deviceIdMatch || deviceNameMatch) {
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
              <span class="id-label">设备ID:</span>
              <span class="device-id">${deviceIdHtml}</span>
            </div>
            <div class="device-name">${deviceNameHtml}</div>
          </div>
        </div>
        <div class="vendor-info">
          <div class="vendor-details">
            <span class="id-label">供应商:</span>
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
  elements.pageInfo.textContent = `第 ${currentPageNum} 页，共 ${totalPages} 页`

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
  elements.searchResults.textContent = currentResults.length.toLocaleString()

  // 更新搜索结果文本，重点展示设备数量
  const query = elements.searchInput.value.trim()
  if (query) {
    elements.searchResultsText.textContent = `找到 ${currentResults.length.toLocaleString()} 个设备`
  }
  else {
    elements.searchResultsText.textContent = `显示所有 ${deviceCount.toLocaleString()} 个设备`
  }
}

// 版本信息相关函数
async function loadVersionInfo(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}usb.ids.version.json`)
    if (response.ok) {
      versionInfo = await response.json() as VersionInfo
      updateVersionDisplay()
      startCountdown()
    }
  }
  catch (error) {
    console.warn('Failed to load version info:', error)
  }
}

function updateVersionDisplay(): void {
  if (!versionInfo)
    return

  // 显示版本号（带v前缀）
  elements.versionNumber.textContent = `v${versionInfo.version}`

  // 显示获取时间（转换为本地时间）
  const fetchDate = new Date(versionInfo.fetchTime)
  elements.fetchTime.textContent = fetchDate.toLocaleString()

  // 计算下次更新时间（下一个UTC 0点）
  const now = new Date()
  const nextUpdateTime = new Date(now)
  nextUpdateTime.setUTCDate(nextUpdateTime.getUTCDate() + 1)
  nextUpdateTime.setUTCHours(0, 0, 0, 0)
  elements.nextUpdate.textContent = nextUpdateTime.toLocaleString()
}

function startCountdown(): void {
  if (!versionInfo)
    return

  // 清除之前的倒计时，防止重复创建定时器
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }

  function updateCountdown(): void {
    if (!versionInfo)
      return

    const now = new Date()
    const nextUpdateTime = new Date(now)
    nextUpdateTime.setUTCDate(nextUpdateTime.getUTCDate() + 1)
    nextUpdateTime.setUTCHours(0, 0, 0, 0)
    const timeLeft = nextUpdateTime.getTime() - now.getTime()

    if (timeLeft <= 0) {
      elements.countdown.textContent = '需要更新'
      elements.countdown.classList.add('urgent')
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
      return
    }

    // 计算剩余时间
    const hours = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

    // 格式化显示
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    elements.countdown.textContent = timeString

    // 如果剩余时间少于1小时，添加紧急样式
    if (timeLeft < 60 * 60 * 1000) {
      elements.countdown.classList.add('urgent')
    }
    else {
      elements.countdown.classList.remove('urgent')
    }
  }

  // 立即更新一次
  updateCountdown()

  // 每秒更新倒计时
  countdownInterval = setInterval(updateCountdown, 1000)
}

// 事件处理函数
function handleSearch(): void {
  const query = elements.searchInput.value.trim()
  const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value as 'all' | 'vendor' | 'device' || 'all'

  // 显示/隐藏清除按钮
  elements.clearSearch.style.display = query ? 'block' : 'none'

  // 执行搜索
  currentResults = searchUsbData({ query, searchType })
  currentPage = 1

  // 更新URL参数
  updateUrlParams(query, searchType, currentPage)

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
  const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value as 'all' | 'vendor' | 'device' || 'all'
  updateUrlParams(query, searchType, currentPage)

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
  const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value as 'all' | 'vendor' | 'device' || 'all'
  updateUrlParams(query, searchType, currentPage)

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
    const searchType = (document.querySelector('input[name="searchType"]:checked') as HTMLInputElement)?.value as 'all' | 'vendor' | 'device' || 'all'
    updateUrlParams(query, searchType, currentPage)

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
      searchTypeRadios: document.querySelectorAll('input[name="searchType"]') as NodeListOf<HTMLInputElement>,
      headerTotalVendors: document.getElementById('headerTotalVendors') as HTMLElement,
      headerTotalDevices: document.getElementById('headerTotalDevices') as HTMLElement,
      searchResults: document.getElementById('searchResults') as HTMLElement,
      searchResultsText: document.getElementById('searchResultsText') as HTMLElement,
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
      nextUpdate: document.getElementById('nextUpdate') as HTMLElement,
      countdown: document.getElementById('countdown') as HTMLElement,
    }

    // 异步加载USB IDs数据
    const usbIdsModule = await import('virtual:usb-ids')
    const usbIdsData = usbIdsModule.default
    console.log('USB IDs Data loaded:', usbIdsData)

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

    // 设置搜索类型
    const searchTypeRadio = document.querySelector(`input[name="searchType"][value="${urlParams.searchType}"]`) as HTMLInputElement
    if (searchTypeRadio) {
      searchTypeRadio.checked = true
    }

    // 设置当前页
    currentPage = urlParams.page

    // 初始搜索（显示所有数据或URL参数指定的搜索结果）
    handleSearch()

    // 隐藏加载状态
    hideLoadingState()
  }
  catch (error) {
    console.error('Failed to load USB IDs data:', error)
    hideLoadingState()
    showEmptyState()
  }

  // 绑定事件
  elements.searchInput.addEventListener('input', debouncedSearch)
  elements.clearSearch.addEventListener('click', clearSearch)

  elements.searchTypeRadios.forEach((radio) => {
    radio.addEventListener('change', handleSearch)
  })

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
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

// 启动应用
if (globalThis.window) {
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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时清除定时器
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }
    else {
      // 页面显示时重新启动倒计时
      if (versionInfo) {
        startCountdown()
      }
    }
  })
}
