"use client";

import { useEffect, useRef, useState } from "react";

export function ArticleViewTracker({
  slug,
  initialViews,
}: {
  slug: string;
  initialViews: number;
}) {
  const [views, setViews] = useState(initialViews);
  const posted = useRef(false);

  useEffect(() => {
    if (posted.current) return;
    posted.current = true;

    fetch(`/api/articles/${slug}/view`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { views?: number };
        if (typeof data.views === "number") setViews(data.views);
      })
      .catch(() => undefined);
  }, [slug]);

  return <span>阅读 {views}</span>;
}
