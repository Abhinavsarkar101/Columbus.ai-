import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SSRF & URL validation helper
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const hostname = url.hostname.toLowerCase();
    // Block localhost, loopback, private IPv4 / IPv6 addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Decode HTML entities
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&bull;/g, '•')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return '';
      }
    });
}

// Clean HTML to text preserving bullet structure and newlines
function htmlToCleanText(html: string): string {
  if (!html) return '';

  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n');

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);

  // Normalize lines and whitespace
  const lines = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0));

  return lines.join('\n').trim();
}

// Clean title of website branding suffixes
function cleanJobTitle(title: string): string {
  if (!title) return 'Job Posting';
  let t = decodeHtmlEntities(title.trim());
  t = t.replace(/\s*[|–—\-]\s*(LinkedIn|Greenhouse|Lever|Ashby|Indeed|Glassdoor|Workday|Careers|Job Application).*$/i, '');
  t = t.replace(/^Job\s+Application\s+for\s+/i, '');
  return t.trim() || 'Job Role';
}

// Clean company name
function cleanCompanyName(company: string, targetUrl: string): string {
  if (company && company !== 'Target Employer') {
    return decodeHtmlEntities(company.trim());
  }
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch {
    // fallback
  }
  return 'Target Company';
}

// Extract Schema.org JSON-LD JobPosting data
function extractJsonLd(html: string): { title?: string; company?: string; description?: string } | null {
  const jsonLdRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const content = match[1].trim();
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data];

      for (const item of items) {
        const type = item['@type'];
        const isJobPosting =
          type === 'JobPosting' ||
          (Array.isArray(type) && type.includes('JobPosting'));

        if (isJobPosting) {
          let title = item.title || item.name;
          let company = '';
          if (item.hiringOrganization) {
            company =
              typeof item.hiringOrganization === 'string'
                ? item.hiringOrganization
                : item.hiringOrganization.name || '';
          }
          let description = item.description || '';

          if (description) {
            return {
              title: title ? String(title) : undefined,
              company: company ? String(company) : undefined,
              description: htmlToCleanText(description),
            };
          }
        }
      }
    } catch {
      // Continue to next JSON-LD block
    }
  }
  return null;
}

// Extract from HTML using heuristics
function extractTextFromHtml(html: string, targetUrl: string): { text: string; title: string; company: string } {
  // 1. Try JSON-LD first (highest fidelity)
  const jsonLd = extractJsonLd(html);
  if (jsonLd && jsonLd.description && jsonLd.description.length > 80) {
    return {
      text: jsonLd.description.slice(0, 15000),
      title: cleanJobTitle(jsonLd.title || ''),
      company: cleanCompanyName(jsonLd.company || '', targetUrl),
    };
  }

  // 2. Extract Title
  let title = '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    title = cleanJobTitle(h1Match[1].replace(/<[^>]+>/g, ' '));
  }
  if (!title) {
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = cleanJobTitle(ogTitleMatch[1]);
    }
  }
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = cleanJobTitle(titleMatch[1]);
    }
  }

  // 3. Extract Company
  let company = '';
  const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
  if (ogSiteMatch && ogSiteMatch[1]) {
    company = ogSiteMatch[1].trim();
  }
  company = cleanCompanyName(company, targetUrl);

  // 4. Extract Description Container
  // Strip head, nav, footer, header, script, style
  let stripped = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ');

  // Look for semantic JD containers
  const containerRegexes = [
    /<(?:div|section|article)[^>]*(?:itemprop=["']description["']|class=["'][^"']*(?:job[-_]?description|posting[-_]?description|job[-_]?details|description__text|show-more-less-html__markup)[^"']*)[^>]*>([\s\S]*?)<\/(?:div|section|article)>/i,
    /<(?:div|section|article)[^>]*id=["'][^"']*(?:job[-_]?description|posting[-_]?description|job[-_]?details|content)[^"']*[^>]*>([\s\S]*?)<\/(?:div|section|article)>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
  ];

  for (const regex of containerRegexes) {
    const containerMatch = stripped.match(regex);
    if (containerMatch && containerMatch[1]) {
      const containerText = htmlToCleanText(containerMatch[1]);
      if (containerText.length > 120) {
        return {
          text: containerText.slice(0, 15000),
          title: title || 'Job Role',
          company: company,
        };
      }
    }
  }

  // Fallback: Paragraph and list extraction
  const pMatches = stripped.match(/<(p|li|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi) || [];
  const extractedParagraphs: string[] = [];

  for (const p of pMatches) {
    const plain = htmlToCleanText(p);
    if (plain.length > 20 && !extractedParagraphs.includes(plain)) {
      extractedParagraphs.push(plain);
    }
  }

  let textBody = extractedParagraphs.join('\n\n');
  if (!textBody || textBody.length < 100) {
    textBody = htmlToCleanText(stripped);
  }

  return {
    text: textBody.slice(0, 15000),
    title: title || 'Job Role',
    company: company,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // API endpoint for fetching and parsing Job Description from URL
  app.all('/api/fetch-jd', async (req, res) => {
    const targetUrl = (req.method === 'POST' ? req.body?.url : req.query?.url) as string;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid job posting URL.' });
    }

    const trimmedUrl = targetUrl.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format or restricted destination address. Please provide a public http/https job link.',
      });
    }

    try {
      let fetchUrl = trimmedUrl;
      const requestHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      };

      // Special handling for LinkedIn job URLs to use guest jobPosting API
      // Matches both /jobs/view/12345678 and ?currentJobId=12345678
      if (trimmedUrl.includes('linkedin.com')) {
        const jobIdMatch =
          trimmedUrl.match(/\/jobs\/view\/([0-9]+)/i) ||
          trimmedUrl.match(/currentJobId=([0-9]+)/i) ||
          trimmedUrl.match(/([0-9]{8,11})/);

        if (jobIdMatch && jobIdMatch[1]) {
          const jobId = jobIdMatch[1];
          fetchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9500); // 9.5s timeout

      let response: Response;
      try {
        response = await fetch(fetchUrl, {
          signal: controller.signal,
          headers: requestHeaders,
        });
      } catch (err: any) {
        // If LinkedIn guest endpoint failed, try direct URL
        if (fetchUrl !== trimmedUrl) {
          response = await fetch(trimmedUrl, {
            signal: controller.signal,
            headers: requestHeaders,
          });
        } else {
          throw err;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error: `Job website returned HTTP ${response.status} (${response.statusText}). The destination page may require user login or block automated requests. You can also paste the text directly into the Job Description box below.`,
        });
      }

      const html = await response.text();
      if (!html || html.length < 50) {
        return res.status(422).json({
          success: false,
          error: 'Retrieved empty content from this job link. Please verify the URL or paste the job description text manually.',
        });
      }

      const parsed = extractTextFromHtml(html, trimmedUrl);

      if (!parsed.text || parsed.text.length < 50) {
        return res.status(422).json({
          success: false,
          error:
            'Could not extract sufficient job description text from this link (the page content may be rendered dynamically via client-side JavaScript or require login). You can paste the job text directly into the text area below.',
        });
      }

      return res.json({
        success: true,
        text: parsed.text,
        title: parsed.title,
        company: parsed.company,
        sourceUrl: trimmedUrl,
        importedAt: Date.now(),
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return res.status(504).json({
          success: false,
          error: 'Request timed out while connecting to the job posting URL (9.5s limit). You can paste the job description manually.',
        });
      }
      return res.status(500).json({
        success: false,
        error: `Could not reach target URL: ${err.message || 'Network error'}. You can paste the job description directly below.`,
      });
    }
  });

  // Setup Vite middleware in dev or serve static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
