// Run with playwright-cli run-code --filename=tests/responsive.browser.js
// Open the target app first. Uses synthetic gameplay; creates no saved records.
async (page) => {
  await page.goto(page.url().split('/').slice(0, 3).join('/') + '/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
  const viewports = [[320, 740], [390, 844], [768, 1024], [844, 390], [1024, 768], [1440, 900], [1920, 1080]];
  const checks = [];
  const audit = async (screen, capture = false) => {
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      const result = await page.evaluate(() => {
        const visible = e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
        const bad = [...document.querySelectorAll('button, input, summary')].filter(visible).flatMap(e => {
          const r = e.getBoundingClientRect();
          // Signal stages intentionally clip decorative lanes/planets, not controls or text.
          const clippedText = !e.matches('.launch-stage, .cosmos-stage') && e.scrollWidth > e.clientWidth + 2;
          return r.left < -1 || r.right > innerWidth + 1 || r.height < 43 || clippedText
            ? [{ text: e.textContent, x: r.x, width: r.width, height: r.height, scroll: e.scrollWidth, client: e.clientWidth }] : [];
        });
        const grid = document.querySelector('.option-grid');
        const stage = document.querySelector('.launch-stage, .cosmos-stage');
        return { overflow: document.documentElement.scrollWidth > innerWidth, bad,
          stageHeight: stage?.getBoundingClientRect().height ?? null,
          columns: grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').length : null,
          shell: document.querySelector('.app-shell').getBoundingClientRect().width };
      });
      if (result.overflow || result.bad.length) throw new Error(JSON.stringify({ screen, width, height, ...result }));
      if (height <= 500 && width >= 640 && result.stageHeight !== null && result.stageHeight < 280) throw new Error('Landscape signal stage too short: ' + result.stageHeight);
      if (result.columns !== null && result.columns !== (width >= 640 ? 2 : 1)) throw new Error('Wrong story columns: ' + width);
      checks.push({ screen, width, height, columns: result.columns, shell: result.shell });
      if (capture && [390, 768, 1440].includes(width)) {
        await page.screenshot({ path: `output/playwright/responsive-${screen}-${width}.png`, fullPage: true });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
  };
  const click = async name => {
    await page.getByRole('button', { name, exact: true }).click({ force: true });
    await page.clock.runFor(20);
  };
  try {
    await audit('play', true);
    await click('게임 안내');
    await page.locator('.guide-detail summary').first().click({ force: true });
    await audit('guide');
    await click('플레이');
    await page.getByRole('radio', { name: /마스터/ }).click({ force: true });
    await click('게임 7개 시작');
    const firstPrompts = [];
    for (let game = 0; game < 7; game++) {
      await audit('transition-' + game);
      await click('준비됐어요');
      if (game === 0) { await audit('reading', true); await click('다 읽었어요'); }
      await audit('game-' + game, true);
      if (game === 0 || game === 4) {
        for (let q = 0; q < 7; q++) {
          const prompt = await page.locator('#story-question-title').innerText();
          if (game === 0) firstPrompts.push(prompt);
          else if (firstPrompts.includes(prompt)) throw new Error('Repeated immediate question');
          await page.locator('.option-button').first().click({ force: true });
          await page.clock.runFor(20);
          if (await page.getByRole('button', { pressed: true }).count() !== 1) throw new Error('Missing selected answer');
          await audit(`story-${game}-${q}`, q === 0);
          await click(q === 6 ? '결과 보기' : '다음 문제');
        }
      } else if (game === 1 || game === 6) {
        // React effects can schedule the next phase only after runFor yields.
        for (let i = 0; i < 60 && await page.locator('.signal-game').count(); i++) await page.clock.runFor(10000);
        if (await page.locator('.signal-game').count()) throw new Error('Signal game failed to finish');
      } else if (game === 2) {
        for (let i = 0; i < 2; i++) {
          await page.clock.runFor(6100);
          await page.getByRole('textbox').fill('000000');
          await audit('digit-input');
          await click('답 제출');
          await audit('digit-feedback');
          await click(i === 1 ? '결과 보기' : '다음 문제');
        }
      } else {
        const count = game === 3 ? 20 : 12;
        for (let i = 0; i < count; i++) {
          await page.locator(game === 3 ? '.color-button' : '.pattern-button').first().click({ force: true });
          await page.clock.runFor(20);
          if (i === 0) await audit('feedback-' + game);
          await click(i === count - 1 ? '결과 보기' : '다음 문제');
        }
      }
    }
    await page.getByRole('heading', { name: '오늘 한눈에 보기' }).waitFor();
    await audit('report', true);
    await page.locator('.metric-glossary summary').click({ force: true });
    await audit('report-expanded');
    return { checks: checks.length, screens: [...new Set(checks.map(c => c.screen))], viewports, storyDesktop: checks.find(c => c.screen === 'game-0' && c.width === 1440) };
  } finally { await page.clock.resume(); }
}
