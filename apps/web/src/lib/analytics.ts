type GtagCommand =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]
  | ['consent', 'default' | 'update', Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: GtagCommand) => void;
  }
}

let measurementId: string | null = null;

export function initAnalytics(id: string | undefined): void {
  if (!id || typeof window === 'undefined') return;
  if (measurementId) return;
  measurementId = id;

  window.dataLayer = window.dataLayer ?? [];
  const gtag: Window['gtag'] = function (...args) {
    window.dataLayer!.push(args);
  };
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true, send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

export function trackPageView(path: string, title?: string): void {
  if (!measurementId || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}

export function currentEventSlug(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname.match(/^\/e\/([^/]+)/)?.[1];
}
