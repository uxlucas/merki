import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative } from 'node:path';
import type { Plugin } from 'vite';
import { applyReview, parseReviewFile, type ReviewFile, type ReviewUpdate } from './src/lab/review';
import type { LabIcon } from './src/lab/types';

const VIRTUAL_ID = 'virtual:merki-icons';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function readLabIcons(iconsDir: string): LabIcon[] {
  return readdirSync(iconsDir)
    .filter((file) => file.endsWith('.svg') && !file.startsWith('_') && !file.startsWith('.'))
    .sort()
    .map((file) => {
      const name = file.slice(0, -'.svg'.length);
      const metaPath = join(iconsDir, `${name}.json`);
      let meta: LabIcon['meta'] = null;
      if (existsSync(metaPath)) {
        try {
          meta = JSON.parse(readFileSync(metaPath, 'utf8'));
        } catch {
          meta = null;
        }
      }
      return { name, svg: readFileSync(join(iconsDir, file), 'utf8').replace(/^﻿/, ''), meta };
    });
}

export function merkiLab({ iconsDir }: { iconsDir: string }): Plugin {
  const reviewFile = join(iconsDir, '_review.json');
  const isIconFile = (file: string) => {
    const rel = relative(iconsDir, file);
    const name = basename(file);
    return (
      rel !== '' &&
      !rel.startsWith('..') &&
      !isAbsolute(rel) &&
      !name.startsWith('_') &&
      (name.endsWith('.svg') || name.endsWith('.json'))
    );
  };

  return {
    name: 'merki-lab',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      return id === RESOLVED_ID ? `export default ${JSON.stringify(readLabIcons(iconsDir))};` : null;
    },
    configureServer(server) {
      server.watcher.add(iconsDir);
      const reload = (file: string) => {
        if (!isIconFile(file)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', reload);
      server.watcher.on('change', reload);
      server.watcher.on('unlink', reload);

      server.middlewares.use('/__lab/review', (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        const readCurrent = () =>
          parseReviewFile(existsSync(reviewFile) ? readFileSync(reviewFile, 'utf8') : null);
        const unreadable = (error: unknown) =>
          send(500, { error: `icons/_review.json is unreadable, fix it by hand: ${(error as Error).message}` });

        if (req.method === 'GET') {
          try {
            send(200, readCurrent());
          } catch (error) {
            unreadable(error);
          }
          return;
        }
        if (req.method !== 'POST') {
          send(405, { error: 'use GET or POST' });
          return;
        }
        if (!String(req.headers['content-type'] ?? '').startsWith('application/json')) {
          send(415, { error: 'send JSON' });
          return;
        }
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          let current: ReviewFile;
          try {
            current = readCurrent();
          } catch (error) {
            unreadable(error);
            return;
          }
          let next: ReviewFile;
          try {
            next = applyReview(current, JSON.parse(body) as ReviewUpdate, new Date());
          } catch (error) {
            send(400, { error: (error as Error).message });
            return;
          }
          try {
            writeFileSync(reviewFile, `${JSON.stringify(next, null, 2)}\n`);
          } catch (error) {
            send(500, { error: (error as Error).message });
            return;
          }
          send(200, next);
        });
      });
    },
  };
}
