export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined
  return (...args) => {
    if (timeout !== undefined)
      clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
