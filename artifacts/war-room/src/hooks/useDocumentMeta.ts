import { useEffect } from "react";

type Meta = {
  title?: string;
  description?: string;
  canonicalPath?: string; // e.g. "/dashboard"
  ogTitle?: string;
  ogDescription?: string;
};

const SITE_URL = "https://tradexray.lovable.app";

function setMeta(selector: string, attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useDocumentMeta(meta: Meta) {
  useEffect(() => {
    if (meta.title) document.title = meta.title;
    if (meta.description) {
      setMeta('meta[name="description"]', "name", "description", meta.description);
    }
    const url = meta.canonicalPath ? `${SITE_URL}${meta.canonicalPath}` : undefined;
    if (url) {
      setLink("canonical", url);
      setMeta('meta[property="og:url"]', "property", "og:url", url);
    }
    const ogTitle = meta.ogTitle ?? meta.title;
    if (ogTitle) {
      setMeta('meta[property="og:title"]', "property", "og:title", ogTitle);
      setMeta('meta[name="twitter:title"]', "name", "twitter:title", ogTitle);
    }
    const ogDesc = meta.ogDescription ?? meta.description;
    if (ogDesc) {
      setMeta('meta[property="og:description"]', "property", "og:description", ogDesc);
      setMeta('meta[name="twitter:description"]', "name", "twitter:description", ogDesc);
    }
  }, [meta.title, meta.description, meta.canonicalPath, meta.ogTitle, meta.ogDescription]);
}
