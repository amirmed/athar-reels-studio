import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import https from 'https';
import { ALLOWED_TTS_VOICES, MAX_TTS_TEXT_LENGTH } from './electron/ttsConstants.js';
const TTS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const TTS_MAX_REQUESTS_PER_WINDOW = 30;
const ttsIpRequests = new Map<string, number[]>();

function checkTtsRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ttsIpRequests.get(ip) || []).filter(
    (t) => now - t < TTS_RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= TTS_MAX_REQUESTS_PER_WINDOW) {
    ttsIpRequests.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  ttsIpRequests.set(ip, timestamps);
  return true;
}

function ttsProxyPlugin(): import('vite').Plugin {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        const clientIp = (req.socket.remoteAddress || '127.0.0.1').toString();
        const origin = req.headers.origin || '';
        const isAllowedOrigin =
          !origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        const corsHeaders: Record<string, string> =
          isAllowedOrigin && origin ? { 'Access-Control-Allow-Origin': origin } : {};

        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            ...corsHeaders,
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        if (!checkTtsRateLimit(clientIp)) {
          res.writeHead(429, {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          });
          res.end('تم تجاوز الحد المسموح به لطلبات الصوت (30 طلب/دقيقة). يرجى الانتظار.');
          return;
        }

        const urlObj = new URL(req.url || '/', 'http://localhost');
        const text = urlObj.searchParams.get('text');
        const voice = urlObj.searchParams.get('voice') || 'ar-SA-HamedNeural';
        const rate = urlObj.searchParams.get('rate') || '-4%';
        const pitch = urlObj.searchParams.get('pitch') || '-2Hz';

        if (!text || !text.trim()) {
          res.writeHead(400, {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          });
          res.end('Missing or empty text');
          return;
        }

        if (text.length > MAX_TTS_TEXT_LENGTH) {
          res.writeHead(400, {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          });
          res.end(`النص يتجاوز الحد الأقصى المسموح (${MAX_TTS_TEXT_LENGTH} حرف).`);
          return;
        }

        if (!ALLOWED_TTS_VOICES.has(voice)) {
          res.writeHead(400, {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
          });
          res.end('الصوت المطلوب غير مدعوم أو غير مصرح به.');
          return;
        }

        // Sanitize rate and pitch
        const safeRate = /^[+-]?\d+%{1,2}$/.test(rate) ? rate : '-4%';
        const safePitch = /^[+-]?\d+Hz$/.test(pitch) ? pitch : '-2Hz';

        try {
          const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
          const tts = new MsEdgeTTS();
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(text, { pitch: safePitch, rate: safeRate });
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
            ...corsHeaders,
          });
          audioStream.pipe(res);
        } catch {
          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(text)}`;
          https
            .get(
              targetUrl,
              {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                  Referer: 'https://translate.google.com/',
                },
              },
              (apiRes) => {
                res.writeHead(apiRes.statusCode || 200, {
                  'Content-Type': apiRes.headers['content-type'] || 'audio/mpeg',
                  ...corsHeaders,
                });
                apiRes.pipe(res);
              }
            )
            .on('error', (err) => {
              res.writeHead(500, {
                ...corsHeaders,
                'Content-Type': 'text/plain; charset=utf-8',
              });
              res.end(err.message);
            });
        }
      });
    },
  };
}

function cspPlugin(): import('vite').Plugin {
  return {
    name: 'csp-transform-plugin',
    transformIndexHtml(html) {
      const isProd = process.env.NODE_ENV === 'production';
      if (isProd) {
        const prodCsp = "default-src 'self' blob: data:; script-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data: blob:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: blob: data:; worker-src 'self' blob:;";
        return html.replace(
          /<meta http-equiv="Content-Security-Policy"[^>]*\/>/,
          `<meta http-equiv="Content-Security-Policy" content="${prodCsp}" />`
        );
      }
      return html;
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ttsProxyPlugin(),
    cspPlugin(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['ffmpeg-static', 'fluent-ffmpeg'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/preload.ts',
              formats: ['cjs'],
            },
            rollupOptions: {
              output: {
                entryFileNames: 'preload.cjs',
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
