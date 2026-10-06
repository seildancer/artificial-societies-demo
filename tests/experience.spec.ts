import { test, expect, type Page } from '@playwright/test';
import { baselineSnapshot, nodes, snapshot, identities } from '../src/data';
import { getView, initialState, reducer } from '../src/simulation';
import { birthOrder, createdPersonaCount, GENESIS_DURATION, personaBirth, SOCIETY_READY_AT } from '../src/genesis';

const outcomes = identities[0].outcomes;
const crisisSnapshot = snapshot(identities[0].crisis, 'crisis');
const responseSnapshots = Object.fromEntries(outcomes.map(o => [o.id, snapshot(o.metrics, o.id)]));

const visibleAmbientPins = (page: Page) => page.locator('.ambient-avatar-pin').evaluateAll(els => els
  .filter(el => Number((el as HTMLElement).style.opacity) > 0.05 && getComputedStyle(el).visibility === 'visible')
  .map(el => el.getAttribute('data-node')));

test('all timelines restore the same population, sentiment and snapshot time', () => {
  expect(nodes).toHaveLength(229);
  expect(new Set(nodes.map(n => n.id)).size).toBe(229);
  expect(new Set(nodes.map(n => n.z)).size).toBeGreaterThan(200);
  let s = reducer(initialState, { type: 'identity', index: 0 });
  s = reducer(s, { type: 'enter' });
  expect(s.step).toBe('society');
  expect(getView(s).history).toHaveLength(0);
  expect(reducer(s, { type: 'rumour' }).step).toBe('society');
  s = reducer(s, { type: 'tick', dt: SOCIETY_READY_AT + 0.77 });
  expect(getView(s).history).toHaveLength(2);
  const before = s;
  s = reducer(s, { type: 'rumour' });
  expect(getView(s).history).toHaveLength(0);
  const firstMoment = reducer(s, { type: 'tick', dt: 3.6 });
  expect(getView(firstMoment).active).toBeUndefined();
  expect(getView(firstMoment).history).toHaveLength(1);
  const rewind = reducer(s, { type: 'back' });
  expect(rewind.elapsed).toBe(before.elapsed);
  expect(getView(rewind).to).toEqual(baselineSnapshot);
  s = reducer(s, { type: 'tick', dt: 15.23 });
  const rumour = s;
  const rumourHistory = getView(rumour).history;
  expect(rumourHistory).toHaveLength(4);
  expect(getView(s).to).toEqual(crisisSnapshot);
  expect(getView(s).progress).toBe(1);
  s = reducer(s, { type: 'respond' });
  expect(getView(s).history).toEqual(rumourHistory);
  expect(getView(s).activity).toEqual(getView(rumour).activity);
  for (const o of outcomes) {
    expect(getView(s).to).toEqual(crisisSnapshot);
    expect(s.elapsed).toBe(rumour.elapsed);
    expect(getView(s).activity).toEqual(getView(rumour).activity);
    expect(getView(s).history).toEqual(rumourHistory);
    s = reducer(s, { type: 'strategy', strategy: o.id });
    expect(s.running).toBe(true);
    s = reducer(s, { type: 'tick', dt: 14.5 });
    expect(s.step).toBe('outcome');
    expect(getView(s).history).toHaveLength(8);
    expect(getView(s).history.slice(0, 4)).toEqual(rumourHistory);
    expect(getView(s).history[4].text).toBe(o.response);
    expect(getView(s).metrics).toEqual(o.metrics);
    expect(getView(s).to).toEqual(responseSnapshots[o.id]);
    expect(Math.round(responseSnapshots[o.id].filter(x => x === 1).length / 229 * 100)).toBe(o.metrics.supportive);
    expect(Math.round(responseSnapshots[o.id].filter(x => x === -1).length / 229 * 100)).toBe(o.metrics.hostile);
    s = reducer(s, { type: 'back' });
    expect(s.step).toBe('response');
    expect(s.running).toBe(false);
    expect(getView(s).history).toEqual(rumourHistory);
  }
  expect(s.history).toHaveLength(3);
  s = reducer(s, { type: 'back' });
  expect(s.elapsed).toBe(rumour.elapsed);
  expect(getView(s).to).toEqual(crisisSnapshot);
  expect(reducer(s, { type: 'restart' })).toEqual(initialState);
});

test('genesis creates a varied population before any audience activity', () => {
  const society = reducer(reducer(initialState, { type: 'identity', index: 0 }), { type: 'enter' });
  expect(createdPersonaCount(0)).toBe(0);
  expect(createdPersonaCount(GENESIS_DURATION)).toBe(nodes.length);
  expect(new Set(birthOrder.map(n => n.id)).size).toBe(nodes.length);
  expect(new Set(birthOrder.slice(0, 5).map(n => n.category)).size).toBe(5);
  let previousCount = 0;
  for (let elapsed = 0; elapsed < GENESIS_DURATION; elapsed += 0.2) {
    const view = getView({ ...society, elapsed });
    expect(view.personaCount).toBeGreaterThanOrEqual(previousCount);
    expect(view.personaCount).toBeLessThan(nodes.length);
    expect(view.active).toBeUndefined();
    expect(view.history).toHaveLength(0);
    expect(view.activity.posts).toBe(0);
    // The counter reports completed births in both motion modes.
    expect(birthOrder.filter((_, rank) => personaBirth(rank, elapsed, true) === 1)).toHaveLength(view.personaCount);
    previousCount = view.personaCount;
  }
  expect(personaBirth(0, 0.7, false)).toBeGreaterThan(0);
  expect(personaBirth(0, 0.7, false)).toBeLessThan(1);
});

test('genesis counts, previews and pins follow pause, live transition and restart', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /A-list actor/ }).click();
  await expect(page.locator('.history-heading h2')).toHaveText('Persona genesis');
  await expect(page.getByTestId('persona-count')).toHaveText('0');
  await expect(page.getByRole('progressbar', { name: 'Personas created' })).toHaveAttribute('aria-valuenow', '0');
  expect(await visibleAmbientPins(page)).toEqual([]);
  await expect(page.locator('.genesis-persona')).toHaveCount(3);
  const firstPersonas = await page.locator('.genesis-persona').evaluateAll(els => els.map(el => el.getAttribute('data-node')));
  const firstCount = Number(await page.getByTestId('persona-count').innerText());
  expect(firstCount).toBeGreaterThan(0);
  expect(firstCount).toBeLessThan(229);
  expect(await visibleAmbientPins(page)).toEqual([]);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  const pausedCount = await page.getByTestId('persona-count').innerText();
  const pausedPersonas = await page.locator('.genesis-personas').innerText();
  await page.waitForTimeout(900);
  await expect(page.getByTestId('persona-count')).toHaveText(pausedCount);
  await expect(page.locator('.genesis-personas')).toHaveText(pausedPersonas, { useInnerText: true });
  expect(await visibleAmbientPins(page)).toEqual([]);
  await page.screenshot({ path: 'test-results/persona-genesis-desktop.png' });
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect.poll(() => page.locator('.genesis-persona').evaluateAll(els => els.map(el => el.getAttribute('data-node')))).not.toEqual(firstPersonas);
  await expect(page.locator('.history-heading h2')).toHaveText('Society is live');
  await expect(page.locator('.genesis-complete')).toContainText('229 personas');
  await expect(page.locator('.graph')).toHaveAttribute('aria-label', /229 personas/);
  await expect(page.locator('.genesis-build')).toHaveCount(0);
  await expect.poll(async () => (await visibleAmbientPins(page)).length).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/society-live-desktop.png' });
  await page.getByRole('button', { name: 'Change identity' }).click();
  await expect.poll(() => visibleAmbientPins(page)).toEqual([]);
  await page.getByRole('button', { name: /Global pop star/ }).click();
  await expect(page.getByTestId('persona-count')).toHaveText('0');
  expect(await visibleAmbientPins(page)).toEqual([]);
});

test('desktop: genesis, mutations, all three response journeys and comparison', async ({ page }) => {
  // This journey plays genesis, two rumour passes and five responses in real time.
  test.setTimeout(210_000);
  // Keep the history scrollable after removing its explanatory header and footer.
  await page.setViewportSize({ width: 1440, height: 860 });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /You’re famous now.*Can you survive.*a rumour/ })).toBeVisible();
  await expect(page.locator('.graph')).toHaveAttribute('data-renderer', 'webgl');
  await expect(page.locator('.graph')).toHaveCSS('opacity', '1');
  await page.getByRole('button', { name: /A-list actor/ }).focus();
  await expect(page.getByRole('img', { name: 'You as the a-list actor' })).toBeVisible();
  await page.screenshot({ path: 'test-results/identity-desktop.png' });
  await page.getByRole('button', { name: /A-list actor/ }).click();
  await expect(page.locator('.history-heading h2')).toHaveText('Persona genesis');
  await expect(page.locator('.event-history')).toContainText('A familiar face');
  await expect(page.locator('.highlight-avatar-pin')).toHaveAttribute('data-node', '0');
  await expect(page.locator('.highlight-avatar-pin .logo-wire')).toBeVisible();
  await expect(page.locator('.highlight-avatar-pin')).toHaveCSS('opacity', '1');
  await expect(page.locator('.graph')).toHaveAttribute('data-motion', 'highlight');
  const firstPins = await visibleAmbientPins(page);
  expect(firstPins.length).toBeGreaterThan(3);
  expect(firstPins).not.toContain('0');
  await page.screenshot({ path: 'test-results/society-highlight.png' });
  await expect(page.getByRole('button', { name: 'Introduce a rumour' })).toBeEnabled();
  await expect(page.locator('.highlight-avatar-pin')).toHaveCount(0);
  await expect(page.locator('.graph')).toHaveAttribute('data-motion', 'ambient');
  const laterPins = await visibleAmbientPins(page);
  expect(laterPins.length).toBeGreaterThan(3);
  expect(laterPins).not.toEqual(firstPins);
  await page.screenshot({ path: 'test-results/society-desktop.png' });
  await page.getByRole('button', { name: 'Introduce a rumour' }).click();
  await expect(page.locator('.event-history')).toContainText('Watch the last three seconds.');
  await expect(page.locator('.highlight-avatar-pin')).toHaveAttribute('data-node', '2');
  await expect(page.locator('.highlight-avatar-pin .logo-hours')).toBeVisible();
  await expect(page.locator('.event-history')).toContainText('Can’t say this surprises me.');
  await expect(page.locator('.event-history')).toContainText('You learn everything about someone');
  await expect(page.locator('.history-event')).toHaveCount(3);
  // Reading the source should keep its position as later moments arrive.
  await page.locator('.history-scroll').evaluate(el => { el.scrollTop = 0; el.dispatchEvent(new Event('scroll')); });
  await expect(page.locator('.event-history')).toContainText('MULTIPLE CREW MEMBERS');
  await expect(page.locator('.history-scroll')).toHaveJSProperty('scrollTop', 0);
  await expect(page.getByRole('button', { name: 'New moment below' })).toBeVisible();
  await page.getByRole('button', { name: 'New moment below' }).click();
  await page.screenshot({ path: 'test-results/rumour-mutation.png' });
  await expect(page.locator('.event-history')).toContainText('MULTIPLE CREW MEMBERS');
  await expect(page.getByRole('button', { name: 'Choose a response' })).toBeEnabled();
  await expect(page.locator('.history-event')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/rumour-history-desktop.png' });
  await expect(page.locator('.sentiment-key')).toContainText('9% supportive');
  await page.getByRole('button', { name: 'Before the rumour' }).click();
  await expect(page.locator('.sentiment-key')).toContainText('72% supportive');
  await expect(page.getByRole('button', { name: 'Introduce a rumour' })).toBeEnabled();
  await page.getByRole('button', { name: 'Introduce a rumour' }).click();
  await page.getByRole('button', { name: 'Choose a response' }).click();
  await expect(page.locator('.history-event')).toHaveCount(4);
  await expect(page.locator('.event-history')).toContainText('Watch the last three seconds.');
  await page.screenshot({ path: 'test-results/response-choices.png' });
  for (const o of outcomes) {
    await expect(page.locator('.sentiment-key')).toContainText('9% supportive');
    await page.getByRole('button', { name: new RegExp(o.title.replace('+', '\\+')) }).click();
    await expect(page.locator('.highlight-avatar-pin')).toHaveAttribute('data-node', '-1');
    await expect(page.locator('.highlight-avatar-pin .portrait-0')).toBeVisible();
    await expect(page.locator('.event-history')).toContainText(o.reactions[0].text);
    await expect(page.locator('.event-history')).toContainText(o.reactions[1].text);
    await expect(page.locator('.event-history')).toContainText(o.reactions[2].text);
    await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
    await expect(page.locator('.outcome-card.selected-result').getByRole('heading', { name: o.insight })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Response outcome' })).toContainText(`${o.metrics.belief}%`);
    await expect(page.getByRole('complementary', { name: 'Public sentiment' })).toHaveCount(0);
    await page.locator('.outcome-card.selected-result summary').click();
    await expect(page.locator('.outcome-card.selected-result .statement-quote')).toBeVisible();
    await page.locator('.outcome-card.selected-result summary').click();
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1280, height: 640 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      await expect(page.getByRole('button', { name: 'Try another response' })).toBeInViewport({ ratio: 1 });
      expect(await page.evaluate(() => ({
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }))).toEqual(viewport);
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.screenshot({ path: `test-results/outcome-${o.id}.png` });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.getByRole('button', { name: 'Try another response' }).click();
    await expect(page.locator('.history-event')).toHaveCount(4);
    await expect(page.locator('.experience')).toHaveAttribute('data-step', 'response');
  }
  await expect(page.getByText('TRIED', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: /Defend the context/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await expect(page.locator('.outcome-card')).toHaveCount(3);
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
  await page.getByRole('button', { name: /Global pop star/ }).click();
  await expect(page.getByRole('img', { name: 'You as the global pop star' })).toBeVisible();
  await expect(page.locator('.history-heading h2')).toHaveText('Persona genesis');
  await expect(page.locator('.genesis-persona')).toHaveCount(3);
  expect(await visibleAmbientPins(page)).toEqual([]);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  const genesisCount = await page.getByTestId('persona-count').innerText();
  await expect(page.getByTestId('persona-count')).toBeInViewport({ ratio: 1 });
  await expect(page.locator('.genesis-persona').last()).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'test-results/persona-genesis-mobile.png', fullPage: true });
  await page.waitForTimeout(400);
  await expect(page.getByTestId('persona-count')).toHaveText(genesisCount);
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await expect(page.locator('.history-heading h2')).toHaveText('Society is live');
  await expect(page.locator('.history-event')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await expect(page.locator('.history-status')).toHaveText('Paused');
  await expect(page.locator('.highlight-avatar-pin')).toHaveAttribute('data-node', '0');
  await expect(page.locator('.highlight-avatar-pin')).toHaveCSS('opacity', '1');
  await expect(page.locator('.highlight-avatar-pin .logo-wire')).toBeInViewport();
  await expect(page.locator('.graph')).toHaveAttribute('data-motion', 'reduced');
  const pausedPins = await visibleAmbientPins(page);
  expect(pausedPins.length).toBeGreaterThan(0);
  expect(pausedPins.length).toBeLessThanOrEqual(7);
  await page.screenshot({ path: 'test-results/pins-mobile-paused.png', fullPage: true });
  const record = await page.locator('.history-list').innerText();
  await page.waitForTimeout(4200);
  await expect(page.locator('.highlight-avatar-pin')).toHaveCSS('opacity', '1');
  expect(await visibleAmbientPins(page)).toEqual(pausedPins);
  await expect(page.locator('.history-list')).toHaveText(record, { useInnerText: true });
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await page.getByRole('button', { name: 'Introduce a rumour' }).click();
  await page.getByRole('button', { name: 'Choose a response' }).click();
  await expect(page.locator('.history-event')).toHaveCount(4);
  await page.locator('.history-scroll').evaluate(el => { el.scrollTop = 0; });
  await page.locator('.history-event').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.history-event').first()).toBeInViewport();
  await page.screenshot({ path: 'test-results/choices-mobile.png', fullPage: true });
  await page.getByRole('button', { name: /Lead with empathy/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await page.screenshot({ path: 'test-results/outcome-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Try another response' }).click();
  await expect(page.locator('.sentiment-key')).toContainText('14% supportive');
  await page.getByRole('button', { name: 'Back to the rumour' }).click();
  await page.getByRole('button', { name: 'Before the rumour' }).click();
  await page.getByRole('button', { name: 'Change identity' }).click();
  await page.getByRole('button', { name: /Actor & studio founder/ }).click();
  await expect(page.getByRole('img', { name: 'You as the actor & studio founder' })).toBeVisible();
});

test('narrow mobile keeps the hero clear and response choices reachable', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const copy = await page.locator('.intro-copy').boundingBox();
  const graph = await page.locator('.graph').boundingBox();
  expect(copy!.y + copy!.height).toBeLessThan(graph!.y);
  await page.screenshot({ path: 'test-results/narrow-identity.png', fullPage: true });
  await page.getByRole('button', { name: /Actor & studio founder/ }).click();
  await page.getByRole('button', { name: 'Introduce a rumour' }).click();
  await page.getByRole('button', { name: 'Choose a response' }).click();
  await page.getByRole('button', { name: 'Read the original incident' }).click();
  await expect(page.locator('.incident-brief h3')).toBeInViewport();
  await expect(page.locator('.incident-brief')).toContainText(identities[2].incident);
  const network = await page.locator('.graph').boundingBox();
  const controls = await page.locator('.response-choices').boundingBox();
  expect(network!.y + network!.height).toBeLessThan(controls!.y);
  await page.screenshot({ path: 'test-results/narrow-choices.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: /Explain the joke/ }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-running', 'true');
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await expect(page.locator('.outcome-card')).toHaveCount(3);
  await expect(page.locator('.overall-score strong')).toHaveText(['-3.3', '+6.3', '+14.7']);
  await expect(page.locator('.outcome-card.selected-result .overall-impact')).toContainText('Net setback');
  const comparison = page.locator('.outcome-card.selected-result .compare-metric');
  await expect(comparison.nth(0)).toContainText('Hostile audience');
  await expect(comparison.nth(0)).toContainText('Before 66% → after 72%');
  await expect(comparison.nth(0)).toContainText('-6 pp');
  await expect(comparison.nth(1)).toContainText('Believe the rumour');
  await expect(comparison.nth(1)).toContainText('Before 67% → after 38%');
  await expect(comparison.nth(1)).toContainText('+29 pp');
  await expect(comparison.nth(2)).toContainText('Story reach index');
  await expect(comparison.nth(2)).toContainText('Before 100 → after 133');
  await expect(comparison.nth(2)).toContainText('-33 points');
  await expect(comparison.nth(0)).toContainText('Worse');
  await expect(comparison.nth(1)).toContainText('Better');
  await expect(comparison.nth(2)).toContainText('Worse');
  await page.locator('.outcome-card').nth(2).getByRole('button', { name: 'Watch this branch' }).click();
  await expect(page.locator('.experience')).toHaveAttribute('data-running', 'true');
  await expect(page.locator('.history-list')).toContainText(identities[2].outcomes[2].response);
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'outcome');
  await expect(page.locator('.outcome-card.selected-result h3')).toHaveText('Acknowledge + clarify');
  await expect(page.locator('.outcome-card').first()).toContainText('PREVIOUSLY PLAYED');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/narrow-comparison.png', fullPage: true });
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
  await page.getByRole('button', { name: /Actor & studio founder/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience')).toHaveAttribute('data-step', 'society');
  await expect(page.locator('.event-history')).toContainText('actor & studio founder');
  await expect(page.locator('.highlight-avatar-pin')).toHaveAttribute('data-node', '0');
  await expect(page.locator('.highlight-avatar-pin .logo-wire')).toBeInViewport();
});

for (const [identity, scenario] of identities.entries()) {
  test(`${scenario.title}: all branches restore the same crisis and preserve distinct reactions`, () => {
    let s = reducer(reducer(initialState, { type: 'identity', index: identity }), { type: 'enter' });
    s = reducer(s, { type: 'tick', dt: SOCIETY_READY_AT });
    s = reducer(s, { type: 'rumour' });
    s = reducer(s, { type: 'tick', dt: 15 });
    const original = getView(s).history;
    expect(getView(s).metrics).toEqual(scenario.crisis);
    s = reducer(s, { type: 'respond' });
    for (const o of scenario.outcomes) {
      expect(getView(s).metrics).toEqual(scenario.crisis);
      s = reducer(s, { type: 'strategy', strategy: o.id });
      s = reducer(s, { type: 'tick', dt: 15 });
      expect(getView(s).metrics).toEqual(o.metrics);
      expect(getView(s).history.slice(0, 4)).toEqual(original);
      expect(getView(s).history.slice(5).map(p => p.text)).toEqual(o.reactions.map(r => r.text));
      expect(o.metrics.supportive + o.metrics.hostile).toBeLessThanOrEqual(100);
      const replay = reducer(s, { type: 'replay', strategy: o.id });
      expect(getView(replay).metrics).toEqual(scenario.crisis);
      expect(getView(replay).history).toEqual(original);
      expect(replay.history).toEqual(s.history);
      s = reducer(s, { type: 'back' });
    }
    expect(s.history).toHaveLength(3);
    expect(reducer(s, { type: 'restart' }).history).toEqual([]);
  });
}
