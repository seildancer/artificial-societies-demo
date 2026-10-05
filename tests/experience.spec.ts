import { test, expect } from '@playwright/test';
import { baselineSnapshot, crisisSnapshot, nodes, outcomes, responseSnapshots } from '../src/data';
import { getView, initialState, reducer } from '../src/simulation';

test('all timelines restore the same population, sentiment and snapshot time', () => {
  expect(nodes).toHaveLength(229);
  expect(new Set(nodes.map(n => n.id)).size).toBe(229);
  expect(new Set(nodes.map(n => n.z)).size).toBeGreaterThan(200);
  let s = reducer(initialState, { type: 'identity', index: 1 });
  s = reducer(s, { type: 'enter' });
  expect(s.step).toBe('society');
  expect(reducer(s, { type: 'rumour' }).step).toBe('society');
  s = reducer(s, { type: 'tick', dt: 11.57 });
  const before = s;
  s = reducer(s, { type: 'rumour' });
  const rewind = reducer(s, { type: 'back' });
  expect(rewind.elapsed).toBe(before.elapsed);
  expect(getView(rewind).to).toEqual(baselineSnapshot);
  s = reducer(s, { type: 'tick', dt: 15.23 });
  const rumour = s;
  expect(getView(s).to).toEqual(crisisSnapshot);
  expect(getView(s).progress).toBe(1);
  s = reducer(s, { type: 'respond' });
  expect(getView(s).activity).toEqual(getView(rumour).activity);
  for (const o of outcomes) {
    expect(getView(s).to).toEqual(crisisSnapshot);
    expect(s.elapsed).toBe(rumour.elapsed);
    expect(getView(s).activity).toEqual(getView(rumour).activity);
    s = reducer(s, { type: 'strategy', strategy: o.id });
    expect(s.running).toBe(true);
    s = reducer(s, { type: 'tick', dt: 14.5 });
    expect(s.step).toBe('outcome');
    expect(getView(s).metrics).toEqual(o.metrics);
    expect(getView(s).to).toEqual(responseSnapshots[o.id]);
    expect(Math.round(responseSnapshots[o.id].filter(x => x === 1).length / 229 * 100)).toBe(o.metrics.supportive);
    expect(Math.round(responseSnapshots[o.id].filter(x => x === -1).length / 229 * 100)).toBe(o.metrics.hostile);
    s = reducer(s, { type: 'back' });
    expect(s.step).toBe('response');
    expect(s.running).toBe(false);
  }
  expect(s.history).toHaveLength(4);
  s = reducer(s, { type: 'back' });
  expect(s.elapsed).toBe(rumour.elapsed);
  expect(getView(s).to).toEqual(crisisSnapshot);
  expect(reducer(s, { type: 'restart' })).toEqual(initialState);
});

test('desktop: genesis, mutations, all four response journeys and comparison', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /You’re famous/ })).toBeVisible();
  await expect(page.locator('.graph')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('.graph')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: /Breakout actor/ }).focus();
  await expect(page.getByRole('img', { name: 'You as the breakout actor' })).toBeVisible();
  await page.screenshot({ path: 'test-results/identity-desktop.png' });
  await page.getByRole('button', { name: /Breakout actor/ }).click();
  await expect(page.getByText('Creating your social world')).toBeVisible();
  await expect(page.locator('.highlight')).toContainText('One to watch.');
  await page.screenshot({ path: 'test-results/society-highlight.png' });
  await expect(page.getByRole('button', { name: 'Spread a rumour' })).toBeEnabled();
  await page.screenshot({ path: 'test-results/society-desktop.png' });
  await page.getByRole('button', { name: 'Spread a rumour' }).click();
  await expect(page.locator('.highlight')).toContainText('Someone on set needs to talk.');
  await expect(page.locator('.highlight')).toContainText('stormed off set. Not a great look');
  await expect(page.locator('.highlight')).toContainText('CHAOS ON SET');
  await page.screenshot({ path: 'test-results/rumour-mutation.png' });
  await expect(page.locator('.highlight')).toContainText('Impossible to work with.');
  await expect(page.getByRole('button', { name: 'Decide how to respond' })).toBeEnabled();
  await expect(page.locator('.sentiment-key')).toContainText('31% supportive');
  await page.getByRole('button', { name: 'Before the rumour' }).click();
  await expect(page.locator('.sentiment-key')).toContainText('72% supportive');
  await expect(page.getByRole('button', { name: 'Spread a rumour' })).toBeEnabled();
  await page.getByRole('button', { name: 'Spread a rumour' }).click();
  await page.getByRole('button', { name: 'Decide how to respond' }).click();
  await page.screenshot({ path: 'test-results/response-choices.png' });
  for (const o of outcomes) {
    await expect(page.locator('.sentiment-key')).toContainText('31% supportive');
    await page.getByRole('button', { name: new RegExp(o.title.replace('+', '\\+')) }).click();
    await expect(page.locator('.highlight')).toContainText(o.reactions[0]);
    await expect(page.locator('.highlight')).toContainText(o.reactions[1]);
    await expect(page.locator('.highlight')).toContainText(o.reactions[2]);
    await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
    await expect(page.getByRole('heading', { name: o.insight })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Response outcome' })).toContainText(`${o.metrics.belief}%`);
    await expect(page.getByRole('complementary', { name: 'Public sentiment' })).toHaveCount(0);
    await page.getByText('Why it played out this way').click();
    await expect(page.locator('.statement-quote')).toBeVisible();
    await page.getByText('Why it played out this way').click();
    await page.screenshot({ path: `test-results/outcome-${o.id}.png` });
    await page.getByRole('button', { name: 'Try another response' }).click();
    await expect(page.locator('.experience')).toHaveAttribute('data-step', 'response');
  }
  await expect(page.getByText('TRIED', { exact: true })).toHaveCount(4);
  await page.getByRole('button', { name: /Say nothing/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await expect(page.locator('.comparison tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'identity');
  expect(errors).toEqual([]);
});

test('mobile and reduced motion preserve the story and accessible controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Motion reduced' })).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/identity-mobile.png', fullPage: true });
  await page.getByRole('button', { name: /Pop star/ }).click();
  await expect(page.getByRole('img', { name: 'You as the pop star' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  const progress = await page.getByRole('progressbar').getAttribute('aria-valuenow');
  await page.waitForTimeout(500);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', progress!);
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await page.getByRole('button', { name: 'Spread a rumour' }).click();
  await page.getByRole('button', { name: 'Decide how to respond' }).click();
  await page.screenshot({ path: 'test-results/choices-mobile.png', fullPage: true });
  await page.getByRole('button', { name: /Apologise/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await page.screenshot({ path: 'test-results/outcome-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Try another response' }).click();
  await expect(page.locator('.sentiment-key')).toContainText('31% supportive');
  await page.getByRole('button', { name: 'Back to the rumour' }).click();
  await page.getByRole('button', { name: 'Before the rumour' }).click();
  await page.getByRole('button', { name: 'Change identity' }).click();
  await page.getByRole('button', { name: /Veteran actor/ }).click();
  await expect(page.getByRole('img', { name: 'You as the veteran actor' })).toBeVisible();
});

test('narrow mobile keeps the hero clear and response choices reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const copy = await page.locator('.intro-copy').boundingBox();
  const graph = await page.locator('.graph').boundingBox();
  expect(copy!.y + copy!.height).toBeLessThan(graph!.y);
  await page.screenshot({ path: 'test-results/narrow-identity.png', fullPage: true });
  await page.getByRole('button', { name: /Veteran actor/ }).click();
  await page.getByRole('button', { name: 'Spread a rumour' }).click();
  await page.getByRole('button', { name: 'Decide how to respond' }).click();
  const network = await page.locator('.graph').boundingBox();
  const controls = await page.locator('.response-choices').boundingBox();
  expect(network!.y + network!.height).toBeLessThan(controls!.y);
  await page.screenshot({ path: 'test-results/narrow-choices.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Short denial/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-running', 'true');
});

test('a browser without WebGL retains the canvas story and keyboard selection', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('.graph')).toHaveAttribute('data-renderer', 'canvas-fallback');
  await page.getByRole('button', { name: /Veteran actor/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'society');
  await expect(page.locator('.highlight')).toContainText('veteran actor');
});
