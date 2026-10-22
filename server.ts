import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // SSRF & URL validation helper
  function isValidHttpUrl(string: string): boolean {
    try {
      const url = new URL(string);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      const hostname = url.hostname.toLowerCase();
      // Block localhost, loopster, private IPs
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.local')
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // HTML to text cleaner helper
  function extractTextFromHtml(html: string): { text: string; title: string; company: string } {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';

    // Extract og:title or meta description
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1].trim();
    }

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    
    // Extract company / organization if possible
    let company = 'Target Employer';
    const compMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
    if (compMatch && compMatch[1]) {
      company = compMatch[1].trim();
    }

    // Strip scripts, styles, nav, footer
    let cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');

    // Extract paragraph and list items text
    const pMatches = cleaned.match(/<(p|li|h[1-6]|span|div)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
    let extractedParagraphs: string[] = [];

    for (const p of pMatches) {
      const plain = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (plain.length > 25 && !extractedParagraphs.includes(plain)) {
        extractedParagraphs.push(plain);
      }
    }

    let textBody = extractedParagraphs.join('\n\n');
    if (!textBody || textBody.length < 100) {
      // Fallback: strip all tags
      textBody = cleaned.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    // Limit size
    if (textBody.length > 5000) {
      textBody = textBody.slice(0, 5000);
    }

    // Clean up title
    title = title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    
    return {
      text: textBody || (ogDescMatch ? ogDescMatch[1] : (descMatch ? descMatch[1] : 'No description content extracted.')),
      title: title || 'Job Posting',
      company: company,
    };
  }

  // API endpoint for fetching Job Description URL
  app.all('/api/fetch-jd', async (req, res) => {
    const targetUrl = (req.method === 'POST' ? req.body?.url : req.query?.url) as string;

    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Please provide a valid job posting URL.' });
    }

    if (!isValidHttpUrl(targetUrl)) {
      return res.status(400).json({ success: false, error: 'Invalid URL scheme or restricted destination address (SSRF prevention).' });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 sec timeout

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          error: `Job website returned HTTP error status ${response.status} (${response.statusText}). The page may block automated requests or require login.`,
        });
      }

      const html = await response.text();
      if (!html || html.length < 50) {
        return res.status(422).json({ success: false, error: 'Retrieved empty or invalid HTML content from the URL.' });
      }

      const parsed = extractTextFromHtml(html);

      if (!parsed.text || parsed.text.length < 40) {
        return res.status(422).json({
          success: false,
          error: 'Could not extract sufficient job description text from this URL. The page may be protected by anti-bot verification or require authentication.',
        });
      }

      return res.json({
        success: true,
        text: parsed.text,
        title: parsed.title,
        company: parsed.company,
        sourceUrl: targetUrl,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return res.status(504).json({ success: false, error: 'Request timed out while trying to fetch the job description URL (exceeded 9s).' });
      }
      return res.status(500).json({
        success: false,
        error: `Failed to fetch URL: ${err.message || 'Network error or CORS/anti-bot blockage by target host.'}`,
      });
    }
  });

  // Setup Vite middleware in development or serve static files in production
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
