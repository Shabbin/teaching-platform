import { useEffect } from "react";

export default function usePerformanceLogger() {
  useEffect(() => {
    function onLoad() {
      const [nav] = performance.getEntriesByType("navigation");
      if (nav) {
        console.log("=== Page Load Metrics ===");
        console.log("DOM Content Loaded:", nav.domContentLoadedEventEnd, "ms");
        console.log("Load Event End:", nav.loadEventEnd, "ms");
        console.log("First Paint:", nav.firstPaint || "N/A");
        console.log("First Contentful Paint:", nav.firstContentfulPaint || "N/A");
      }
      window.removeEventListener("load", onLoad);
    }

    window.addEventListener("load", onLoad);

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // You can customize what you want to log or batch here
        console.warn("Long Task detected:", {
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        });
      });
    });

    observer.observe({ entryTypes: ["longtask"] });

    return () => {
      observer.disconnect();
      window.removeEventListener("load", onLoad);
    };
  }, []);
}
