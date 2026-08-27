import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import https from 'https';

function ttsProxyPlugin(): import('vite').Plugin {
  return {
    name: 'tts-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const text = urlObj.searchParams.get('text');
        const voice = urlObj.searchParams.get('voice') || 'ar-SA-HamedNeural';
        const rate = urlObj.searchParams.get('rate') || '-4%';
        const pitch = urlObj.searchParams.get('pitch') || '-2Hz';
        if (!text) {
          res.statusCode = 400;
          res.end('Missing text');
          return;
        }
        try {
          const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
          const tts = new MsEdgeTTS();
          await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
          const { audioStream } = tts.toStream(text, { pitch, rate });
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=86400',
          });
          audioStream.pipe(res);
        } catch {
          const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q=${encodeURIComponent(text)}`;
          https.get(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
              'Referer': 'https://translate.google.com/',
            }
          }, (apiRes) => {
            res.writeHead(apiRes.statusCode || 200, {
              'Content-Type': apiRes.headers['content-type'] || 'audio/mpeg',
              'Access-Control-Allow-Origin': '*',
            });
            apiRes.pipe(res);
          }).on('error', (err) => {
            res.statusCode = 500;
            res.end(err.message);
          });
        }
      });
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    ttsProxyPlugin(),
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
