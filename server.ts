import 'dotenv/config';
import express from 'express';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server-side Gemini client with platform-managed key and telemetry user-agent
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

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
      hostname.startsWith('169.254.') ||
      hostname === '::1' ||
      hostname === '[::1]' ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fd00:') ||
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
// Phase B: Sanitize JD Text
function sanitizeJdText(text: string, mode: 'import' | 'paste' = 'import'): string {
  if (!text) return '';
  const rawLines = text.split(/\r?\n/).map((l) => l.trim());

  if (mode === 'paste') {
    const collapsed: string[] = [];
    let consecutiveBlanks = 0;
    for (const line of rawLines) {
      if (line.length === 0) {
        consecutiveBlanks++;
        if (consecutiveBlanks <= 1) collapsed.push('');
      } else {
        consecutiveBlanks = 0;
        collapsed.push(line);
      }
    }
    return collapsed.join('\n').trim();
  }

  const cleanedLines: string[] = [];
  let prevCleanLower = '';

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    if (!/[a-zA-Z0-9]/.test(rawLine)) {
      continue;
    }

    let line = rawLine;
    const isBullet = /^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/.test(line);
    if (isBullet) {
      const bulletContent = line.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '').trim();
      if (!/[a-zA-Z0-9]/.test(bulletContent)) {
        continue;
      }
      line = `• ${bulletContent}`;
    }

    const lineLower = line.toLowerCase();
    if (lineLower === prevCleanLower && line.length > 8) {
      continue;
    }

    cleanedLines.push(line);
    prevCleanLower = lineLower;
  }

  const finalLines: string[] = [];
  let blankCount = 0;
  for (const line of cleanedLines) {
    if (line.length === 0) {
      blankCount++;
      if (blankCount <= 1 && finalLines.length > 0) finalLines.push('');
    } else {
      blankCount = 0;
      finalLines.push(line);
    }
  }

  return finalLines.join('\n').trim();
}

function verifyJdInvariants(text: string): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  if (lines.length > 0) {
    const firstNonEmpty = lines.find((l) => l.length > 0);
    if (!firstNonEmpty || !/[a-zA-Z0-9]/.test(firstNonEmpty)) {
      violations.push('leading_marker_or_letterless_block');
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 0) {
      if (/^[•●▪▫◦‣⁃➢✓✔\-\*]+$/.test(line)) {
        violations.push(`orphan_marker_at_line_${i + 1}`);
      } else if (!/[a-zA-Z0-9]/.test(line)) {
        violations.push(`letterless_line_at_line_${i + 1}`);
      }
    }
  }

  return { isValid: violations.length === 0, violations };
}

// Clean HTML to text preserving bullet structure and newlines (Phase B)
function htmlToCleanText(html: string): string {
  if (!html) return '';

  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, ' ')
    .replace(/<input\b[^<]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n');

  // Parse <li> tags: emit text ONLY if non-empty and containing letters/digits
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, liContent) => {
    const rawClean = decodeHtmlEntities(liContent.replace(/<[^>]+>/g, ' ')).trim();
    const strippedGlyphs = rawClean.replace(/^[•●▪▫◦‣⁃➢✓✔\-\*]\s*/, '').trim();
    if (/[a-zA-Z0-9]/.test(strippedGlyphs)) {
      return `\n• ${strippedGlyphs}\n`;
    }
    return ' ';
  });

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);

  let sanitized = sanitizeJdText(text, 'import');
  const check = verifyJdInvariants(sanitized);
  if (!check.isValid) {
    console.warn('[server fetch-jd invariant violation]:', check.violations);
    sanitized = sanitizeJdText(sanitized, 'import');
  }

  return sanitized;
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

  let PORT = Number(process.env.PORT) || 3000;
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed)) PORT = parsed;
  }
  const isProduction = process.env.NODE_ENV === 'production';

  // API endpoint for fetching and parsing Job Description from URL
  app.all('/api/fetch-jd', async (req, res) => {
    const targetUrl = (req.method === 'POST' ? req.body?.url : req.query?.url) as string;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter a valid job posting URL.' });
    }

    const trimmedUrl = targetUrl.trim();

    // SSRF & protocol validation
    if (!isValidHttpUrl(trimmedUrl)) {
      return res.status(400).json({
        success: false,
        errorType: 'ssrf_blocked',
        error: 'Invalid URL format or restricted destination address. Please provide a public http/https job link.',
      });
    }

    // Explicit rejection for login-walled domains if hit directly
    const urlHostname = new URL(trimmedUrl).hostname.toLowerCase();
    if (
      urlHostname.includes('linkedin.com') ||
      urlHostname.includes('indeed.com') ||
      urlHostname.includes('glassdoor.com') ||
      urlHostname.includes('naukri.com')
    ) {
      return res.status(403).json({
        success: false,
        errorType: 'login_walled',
        error: 'This job site requires account login and restricts automated access.',
      });
    }

    try {
      const requestHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      let response: Response;
      try {
        response = await fetch(trimmedUrl, {
          signal: controller.signal,
          headers: requestHeaders,
          redirect: 'follow',
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          errorType: 'not_found',
          error: 'Job posting not found (HTTP 404). The listing may have expired, been taken down, or the URL might be incomplete.',
        });
      }

      if (!response.ok) {
        return res.status(502).json({
          success: false,
          errorType: 'http_error',
          statusCode: response.status,
          error: `Website returned HTTP ${response.status} (${response.statusText}). The destination page may require user login or block automated requests.`,
        });
      }

      // Check Content-Length if provided to prevent >2MB downloads
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
        return res.status(413).json({
          success: false,
          errorType: 'payload_too_large',
          error: 'The target page is larger than the 2MB response cap.',
        });
      }

      const html = (await response.text()).slice(0, 2 * 1024 * 1024); // Cap at 2MB
      if (!html || html.length < 50) {
        return res.status(422).json({
          success: false,
          errorType: 'unreadable',
          error: 'Retrieved empty or insufficient content from this job link. Please verify the URL or paste the job description text manually.',
        });
      }

      const parsed = extractTextFromHtml(html, trimmedUrl);

      if (!parsed.text || parsed.text.length < 50) {
        return res.status(422).json({
          success: false,
          errorType: 'unreadable',
          error:
            'Could not extract sufficient job description text from this link (the page content may be rendered dynamically via client-side JavaScript or require login).',
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
          errorType: 'timeout',
          error: 'Request timed out while connecting to the job posting URL (10s limit).',
        });
      }
      return res.status(500).json({
        success: false,
        errorType: 'network_error',
        error: `Could not reach target URL: ${err.message || 'Network error'}.`,
      });
    }
  });

  // 3. General Gemini Content Generation
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { model = 'gemini-3.8-flash', prompt, contents, config } = req.body || {};
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ success: false, error: 'GEMINI_API_KEY not configured on server.' });
      }

      const inputContents = contents || prompt;
      if (!inputContents) {
        return res.status(400).json({ success: false, error: 'Prompt or contents required.' });
      }

      const response = await ai.models.generateContent({
        model,
        contents: inputContents,
        config,
      });

      return res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error('[server /api/gemini/generate error]:', err?.message || err);
      return res.status(err?.status || 500).json({
        success: false,
        error: err?.message || 'Failed to generate content',
      });
    }
  });

  // 4. General Gemini Content Streaming (SSE)
  app.post('/api/gemini/stream', async (req, res) => {
    try {
      const { model = 'gemini-3.8-flash', prompt, contents, config } = req.body || {};
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({ success: false, error: 'GEMINI_API_KEY not configured on server.' });
      }

      const inputContents = contents || prompt;
      if (!inputContents) {
        return res.status(400).json({ success: false, error: 'Prompt or contents required.' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await ai.models.generateContentStream({
        model,
        contents: inputContents,
        config,
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } catch (err: any) {
      console.error('[server /api/gemini/stream error]:', err?.message || err);
      if (!res.headersSent) {
        return res.status(err?.status || 500).json({
          success: false,
          error: err?.message || 'Failed to stream content',
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: err?.message || 'Stream error' })}\n\n`);
        return res.end();
      }
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

  const server = http.createServer(app);

  // 5. Real-time Live API WebSocket bridge on /api/gemini/live
  try {
    // @ts-ignore
    const { WebSocketServer } = await import('ws');
    const wss = new WebSocketServer({ server, path: '/api/gemini/live' });

    wss.on('connection', async (clientWs: any) => {
      const ai = getGeminiClient();
      if (!ai) {
        clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }));
        clientWs.close();
        return;
      }

      try {
        const session = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a helpful career assistant.',
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              for (const part of message.serverContent?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
                }
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            },
          },
        });

        clientWs.on('message', (data: any) => {
          try {
            const parsed = JSON.parse(data.toString());
            if (parsed.audio) {
              session.sendRealtimeInput({
                audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
              });
            }
          } catch {
            // ignore
          }
        });

        clientWs.on('close', () => {
          try {
            session.close();
          } catch {
            // ignore
          }
        });
      } catch (err: any) {
        clientWs.send(JSON.stringify({ error: err?.message || 'Failed to connect Live session' }));
        clientWs.close();
      }
    });
  } catch (err: any) {
    console.warn('[server ws setup notice]: ws module bridge not initialized:', err?.message || err);
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
