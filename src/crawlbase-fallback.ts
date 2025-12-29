/**
 * Función de respaldo usando Crawlbase en caso de bloqueos o captchas
 * Requiere CRAWLBASE_JS_TOKEN en las variables de entorno
 */

export interface CrawlbaseOptions {
  url: string;
  userAgent?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  country?: string;
  ajaxWait?: number;
  pageWait?: number;
}

/**
 * Obtiene el contenido HTML de una URL usando Crawlbase
 * Esta función se puede usar como respaldo si Playwright falla por captcha
 */
export async function obtenerHTMLConCrawlbase(
  url: string,
  token?: string
): Promise<string | null> {
  const crawlbaseToken = token || process.env.CRAWLBASE_JS_TOKEN;

  if (!crawlbaseToken) {
    console.warn('⚠️  CRAWLBASE_JS_TOKEN no configurado. Saltando fallback de Crawlbase.');
    return null;
  }

  try {
    const apiUrl = `https://api.crawlbase.com/?token=${crawlbaseToken}&url=${encodeURIComponent(url)}&javascript=true`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Crawlbase API error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('❌ Error al usar Crawlbase:', error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}

/**
 * Verifica si hay un captcha o bloqueo en la página
 */
export function detectarCaptcha(html: string): boolean {
  const indicadoresCaptcha = [
    'captcha',
    'recaptcha',
    'hcaptcha',
    'cloudflare',
    'access denied',
    'blocked',
    'robot',
    'verification'
  ];

  const htmlLower = html.toLowerCase();
  return indicadoresCaptcha.some(indicator => htmlLower.includes(indicator));
}

