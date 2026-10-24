import { randomBytes } from "crypto";

export function createSerialSlug(title: string) {
  return createArticleSlug(title).replace(/^article-/, "serial-");
}

export function createArticleSlug(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "article"}-${randomBytes(4).toString("hex")}`;
}
