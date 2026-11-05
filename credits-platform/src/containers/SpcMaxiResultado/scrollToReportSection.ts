/** Scrolls to a report section, leaving room for the sticky identification header. */
export function scrollToReportSection(id: string) {
  if (id === "section-identificacao") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const element = document.getElementById(id);
  if (!element) return;

  const identification = document.getElementById("section-identificacao");
  const offset = Math.max(
    68,
    identification?.getBoundingClientRect().height ?? 0,
  );
  const y = element.getBoundingClientRect().top + window.scrollY - offset - 16;

  window.scrollTo({ top: y, behavior: "smooth" });
}

/** Smoothly scrolls to the top and resolves once it gets there (or after `timeoutMs`). */
export function scrollToTopAndWait(timeoutMs = 1200): Promise<void> {
  return new Promise((resolve) => {
    if (window.scrollY <= 1) {
      resolve();
      return;
    }

    const startedAt = performance.now();
    window.scrollTo({ top: 0, behavior: "smooth" });

    const check = () => {
      if (window.scrollY <= 1 || performance.now() - startedAt >= timeoutMs) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  });
}

/** Ids of the report sections currently rendered. */
export function getRenderedReportSectionIds(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>("[data-print-document] [id^='section-']"),
  ).map((element) => element.id);
}
