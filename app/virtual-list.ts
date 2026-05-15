const SCROLL_BUFFER_ROWS = 6;

export interface VirtualListHandle {
  refresh: () => void;
  scrollToTop: () => void;
  destroy: () => void;
}

export function attachVirtualList(options: {
  scrollEl: HTMLElement;
  innerEl: HTMLElement;
  itemHeight: number;
  getCount: () => number;
  renderItem: (index: number) => HTMLElement;
}): VirtualListHandle {
  const { scrollEl, innerEl, itemHeight, getCount, renderItem } = options;

  const paint = (): void => {
    const count = getCount();
    innerEl.style.minHeight = `${count * itemHeight}px`;
    innerEl.replaceChildren();
    if (count === 0) return;

    const scrollTop = scrollEl.scrollTop;
    const viewH = scrollEl.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - SCROLL_BUFFER_ROWS);
    const end = Math.min(count, Math.ceil((scrollTop + viewH) / itemHeight) + SCROLL_BUFFER_ROWS);

    const frag = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const el = renderItem(i);
      el.style.position = "absolute";
      el.style.top = `${i * itemHeight}px`;
      el.style.left = "0";
      el.style.right = "0";
      el.style.minHeight = `${itemHeight}px`;
      frag.appendChild(el);
    }
    innerEl.appendChild(frag);
  };

  const onScroll = (): void => {
    paint();
  };

  scrollEl.addEventListener("scroll", onScroll, { passive: true });

  return {
    refresh: paint,
    scrollToTop: () => {
      scrollEl.scrollTop = 0;
      paint();
    },
    destroy: () => {
      scrollEl.removeEventListener("scroll", onScroll);
    },
  };
}
