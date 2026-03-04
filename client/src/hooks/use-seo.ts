import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  image?: string;
}

const BASE_URL = "https://uptendapp.com";

function setMetaTag(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({ title, description, path, image = "/og-image.png" }: SEOProps) {
  useEffect(() => {
    const fullUrl = `${BASE_URL}${path}`;
    const imageUrl = image.startsWith("http") ? image : `${BASE_URL}${image}`;

    document.title = title;

    setMetaTag("description", description, true);

    // Open Graph
    setMetaTag("og:title", title);
    setMetaTag("og:description", description);
    setMetaTag("og:image", imageUrl);
    setMetaTag("og:url", fullUrl);
    setMetaTag("og:type", "website");
    setMetaTag("og:site_name", "UpTend");

    // Twitter
    setMetaTag("twitter:card", "summary_large_image", true);
    setMetaTag("twitter:title", title, true);
    setMetaTag("twitter:description", description, true);
    setMetaTag("twitter:image", imageUrl, true);

    // Canonical URL
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", fullUrl);
  }, [title, description, path, image]);
}
