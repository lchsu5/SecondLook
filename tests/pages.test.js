import test from 'node:test';
import { build } from 'esbuild';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('pages render with working section targets, one header, and nonduplicated feedback', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'secondlook-pages-'));
  try {
    const result = await build({
      stdin: {
        resolveDir: process.cwd(),
        loader: 'jsx',
        contents: `
          import React from 'react';
          import { renderToStaticMarkup as render } from 'react-dom/server';
          import assert from 'node:assert/strict';
          import App from './src/App.jsx';
          import Card from './src/components/InterventionCard.jsx';
          import Summary from './src/components/SummaryView.jsx';
          globalThis.window = { location: { hash: '#overview' } };
          const overview = render(<App />);
          assert.ok(overview.includes('<h1>SecondLook</h1>'));
          for (const id of ['overview', 'how-it-works', 'learning']) {
            assert.ok(overview.includes('id="' + id + '"'));
          }
          assert.equal(overview.split('<header').length - 1, 1);
          window.location.hash = '#session';
          const session = render(<App />);
          assert.ok(session.includes('Ready for your session'));
          assert.equal(session.split('<header').length - 1, 1);
          const card = render(<Card intervention={{ issueTitle: 'Check your sign', hint: 'Unique hint' }} onClose={() => {}} />);
          assert.equal(card.split('Unique hint').length - 1, 1);
          assert.ok(card.includes('Dismiss feedback'));
          const summary = render(<Summary interventions={[]} onRestart={() => {}} />);
          assert.ok(summary.includes('role="dialog"'));
          assert.ok(!summary.includes('No strengths recorded'));
          assert.ok(!summary.includes('misconceptions identified'));
        `,
      },
      bundle: true,
      platform: 'node',
      format: 'cjs',
      loader: { '.css': 'empty' },
      define: { 'import.meta.env': '{}' },
      write: false,
      logLevel: 'silent',
    });
    const output = path.join(directory, 'pages.cjs');
    await writeFile(output, result.outputFiles[0].contents);
    execFileSync(process.execPath, [output], { stdio: 'pipe' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
