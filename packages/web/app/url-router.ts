export function getUrlParams(): { query: string; page: number } {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    query: urlParams.get("q") || "",
    page: Number.parseInt(urlParams.get("pageNum") || "1", 10),
  };
}

export function updateUrlParams(query: string, page: number, itemsPerPage: number): void {
  const url = new URL(window.location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  url.searchParams.set("pageSize", itemsPerPage.toString());
  url.searchParams.set("pageNum", page.toString());
  window.history.replaceState({}, "", url.toString());
}
