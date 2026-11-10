// Verify controls against a local copy of the real, hash-verified Unity build.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2];
if (!url) throw new Error('Pass the URL of the local Unity QA fixture.');
const root = path.resolve(__dirname, '..');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_EXECUTABLE || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({ viewport: { width: 1000, height: 650 } }), errors = [];
  let frame;
  page.on('pageerror', error => errors.push(error.message));
  const values = () => {
    const m = gameInstance.Module, h = m.HEAP32, f = m.HEAPF32, b = m.HEAPU8;
    const p = h[h[(h[3363016 >>> 2] + 92) >>> 2] >>> 2], point = h[(p + 24) >>> 2], data = h[(p + 12) >>> 2];
    return {
      p, point, data, jump: f[(data + 40) >>> 2], velocity: f[(point + 116) >>> 2],
      gravity: f[(point + 120) >>> 2], mask: h[(point + 136) >>> 2], speed: f[(p + 60) >>> 2],
      pointGrounded: Boolean(b[point + 124]), playerGrounded: Boolean(b[p + 85]),
      alreadyJumped: Boolean(b[p + 84]), playing: __srMovement.playing,
      extraAvailable: __srMovement.doubleJumpAvailable, boosting: __srMovement.boosting,
      telemetry: __srMovement.getTelemetry()
    };
  };
  const sample = () => frame.evaluate(values);
  const waitGrounded = () => frame.waitForFunction(() => {
    const m = gameInstance.Module, h = m.HEAP32, p = h[h[(h[3363016 >>> 2] + 92) >>> 2] >>> 2];
    const point = h[(p + 24) >>> 2];
    return __srMovement.playing && m.HEAPU8[point + 124] && m.HEAPF32[(point + 116) >>> 2] <= 0.1;
  }, null, { timeout: 20000 });
  const waitVelocityBelow = jump => frame.waitForFunction(jump => {
    const m = gameInstance.Module, h = m.HEAP32, p = h[h[(h[3363016 >>> 2] + 92) >>> 2] >>> 2];
    return m.HEAPF32[(h[(p + 24) >>> 2] + 116) >>> 2] < jump - 0.4;
  }, jump, { timeout: 8000 });
  async function nativeJump() {
    await page.keyboard.down('ArrowUp');
    await frame.waitForFunction(() => __srMovement.doubleJumpAvailable, null, { timeout: 8000 });
    await page.keyboard.up('ArrowUp');
    const result = await sample();
    assert.ok(result.velocity > 0, 'Native first jump must produce positive velocity.');
    assert.ok(result.extraAvailable, 'One extra jump must be available after the native first jump.');
    return result;
  }
  try {
    await page.goto(url);
    frame = page.frames().find(frame => frame.url().includes('/snow-rider-3d/game.html'));
    assert.ok(frame, 'Local fixture must contain the Unity frame.');
    await frame.waitForFunction(() => window.__srMovement?.status === 'ready' && window.__srInvincibility?.status === 'ready', null, { timeout: 60000 });
    const initial = await sample();
    await frame.locator('#srjumpnumber').fill('8');
    await frame.locator('#srjumpnumber').press('Tab');
    assert.equal((await sample()).jump, initial.jump * 2);
    await frame.locator('#srjumpnumber').fill('1');
    await frame.locator('#srjumpnumber').press('Tab');
    await frame.locator('#srhead').click();
    await frame.waitForTimeout(8000);
    const canvas = frame.locator('#gameContainer canvas');
    await canvas.click({ position: { x: 480, y: 300 } });
    await frame.waitForTimeout(2000);
    await canvas.click({ position: { x: 660, y: 365 } });
    await frame.waitForFunction(() => __srMovement.playing, null, { timeout: 15000 });
    // The tutorial's CLICK HERE TO PLAY hit target sits above the canvas bottom.
    await canvas.click({ position: { x: 480, y: 530 } });
    await waitGrounded();
    const ground = await sample();
    assert.ok(Number.isFinite(ground.telemetry.speed));
    assert.ok(Number.isFinite(ground.telemetry.height), 'Native height must calibrate on the ground.');
    console.log('Native ride started; grounded telemetry:', ground.telemetry);

    const first = await nativeJump();
    await waitVelocityBelow(first.jump);
    await page.keyboard.down('ArrowUp');
    const second = await sample();
    await page.keyboard.up('ArrowUp');
    assert.equal(second.extraAvailable, false, 'Extra jump must be consumed.');
    assert.ok(second.velocity > first.jump - 0.3, 'The second keyboard press must restore jump velocity.');
    assert.equal(second.pointGrounded, false);
    assert.equal(second.playerGrounded, false);
    assert.ok(second.telemetry.height > ground.telemetry.height, 'Height must rise during actual flight.');
    await waitVelocityBelow(first.jump);
    await page.keyboard.down('ArrowUp');
    const third = await sample();
    await page.keyboard.up('ArrowUp');
    assert.equal(third.extraAvailable, false);
    assert.ok(third.velocity < first.jump - 0.3, 'A third airborne keyboard press must not trigger another jump.');
    assert.equal(await frame.evaluate(() => __srMovement.tryDoubleJump()), false);
    await waitGrounded();
    await nativeJump();
    await page.keyboard.down('ArrowUp');
    const rearmed = await sample();
    await page.keyboard.up('ArrowUp');
    assert.equal(rearmed.extraAvailable, false, 'Landing must allow precisely one extra jump in the next cycle.');
    assert.ok(rearmed.velocity > first.jump - 0.3);
    console.log('Double jump passed: native first jump, one extra, rejected third, rearmed after landing.');

    const beforeBoost = await sample();
    await page.keyboard.down('b');
    const boosting = await sample();
    assert.equal(boosting.boosting, true);
    assert.ok(boosting.speed > beforeBoost.speed * 100, 'B must change real forward speed, not only the control state.');
    await page.keyboard.up('b');
    const released = await sample();
    assert.equal(released.boosting, false);
    assert.ok(released.speed < boosting.speed / 100, 'Releasing B must immediately restore normal forward speed.');
    assert.ok(Number.isFinite(released.telemetry.speed));
    assert.ok(Number.isFinite(released.telemetry.height));
    console.log('B boost passed:', { before: beforeBoost.speed, held: boosting.speed, released: released.speed });

    await frame.locator('#srhead').click();
    const beforeMaximum=await sample();
    await frame.locator('#srpresetmax').click();
    const maximum=await sample();
    assert.ok(maximum.speed > beforeMaximum.speed * 9000, '10,000× preset must multiply real forward speed.');
    await frame.waitForTimeout(200);
    const runningMaximum=await sample();
    assert.ok(Number.isFinite(runningMaximum.speed) && runningMaximum.speed > 50000, 'Native speed must stay boosted across game frames.');
    console.log('10,000× speed passed:', {before:beforeMaximum.speed, selected:maximum.speed, afterFrames:runningMaximum.speed});
    await frame.locator('#srpresetnormal').click();
    assert.ok((await sample()).speed < 100);
    await frame.locator('#srflight').click();
    await frame.locator('#srrise').scrollIntoViewIfNeeded();
    await frame.locator('#srrise').hover();
    await page.mouse.down();
    assert.equal((await sample()).velocity, 16);
    await page.mouse.up();
    assert.equal((await sample()).velocity, 0);
    await frame.locator('#srpresetmax').click();
    await frame.waitForTimeout(1000);
    const flyingMaximum=await sample();
    assert.ok(flyingMaximum.playing && Number.isFinite(flyingMaximum.speed) && flyingMaximum.speed>50000);
    assert.equal(flyingMaximum.gravity,0);
    console.log('10,000× flying passed:',flyingMaximum.telemetry);
    await frame.locator('#srpresetnormal').click();
    await frame.locator('#srnormal').click();
    const restored = await sample();
    assert.equal(restored.mask, initial.mask);
    assert.equal(restored.gravity, initial.gravity);
    assert.equal(await frame.evaluate(() => __srInvincibility.flag.value), 0);
    await frame.locator('#srreset').click();
    assert.equal(await frame.evaluate(() => __srInvincibility.flag.value), 1);
    await frame.locator('#srbody').evaluate(element => element.scrollTop = 0);
    await page.screenshot({ path: '/tmp/snowrider-panel-game.png' });
    assert.deepEqual(errors, []);
    console.log('Actual Unity game passed: adjustable jump, native double jump/landing, B boost/release, finite height/speed, 10,000× preset, held flight/hover, normal physics restoration, shield and reset.');
  } catch (error) {
    if (frame) {
      try { console.error('Native state at failure:', await sample()); } catch {}
    }
    await page.screenshot({ path: '/tmp/snowrider-game-failure.png' }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
