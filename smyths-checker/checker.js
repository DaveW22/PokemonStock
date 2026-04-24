'use strict';

/**
 * checker.js — Smyths Toys stock alert tool
 *
 * - Checks each product in products.js every 3 minutes.
 * - Waits 5 seconds between individual product checks.
 * - Sends a desktop notification and opens the product page the first time
 *   a product appears available. Will notify again if it goes out of stock
 *   and comes back.
 * - Never adds anything to the basket or attempts checkout.
 */

const { chromium } = require('playwright');
const notifier = require('node-notifier');
const { exec } = require('child_process');
const path = require('path');

const products = require('./products');

// ── Configuration ─────────────────────────────────────────────────────────────

const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between full sweeps
const DELAY_BETWEEN_CHECKS_MS = 5_000;   // 5 seconds between individual products

// Phrases that indicate the product CAN be purchased
const IN_STOCK_PHRASES = [
  'Add to Basket',
  'Click & Collect',
  'Home Delivery',
];

// Phrases that explicitly indicate unavailability
const OUT_OF_STOCK_PHRASES = [
  'Out of Stock',
  'Currently unavailable',
];

// ── State ─────────────────────────────────────────────────────────────────────

/**
 * Tracks which product URLs have already triggered a notification.
 * Cleared when a product goes back out of stock so the user is alerted again
 * if it becomes available a second time.
 */
const notifiedUrls = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Opens a URL in the system default browser (macOS / Windows / Linux). */
function openInBrowser(url) {
  const cmd =
    process.platform === 'darwin' ? `open "${url}"` :
    process.platform === 'win32'  ? `start "" "${url}"` :
                                    `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error(`    [!] Could not open browser: ${err.message}`);
  });
}

/** Fires a desktop notification and opens the product page. */
function alertUser(product) {
  notifier.notify(
    {
      title: '🛒 StockWise — Smyths Alert',
      message: `${product.name} appears to be available!`,
      sound: true,
      wait: false,
      icon: path.join(__dirname, '..', 'assets', 'icon.png'), // optional, skipped if not found
    },
    () => { /* ignore callback errors */ },
  );

  openInBrowser(product.url);
}

function timestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

// ── Core check ────────────────────────────────────────────────────────────────

/**
 * Opens a single product page, reads the visible body text, and determines
 * availability based on the phrase lists above.
 * Does NOT interact with the page beyond navigation.
 */
async function checkProduct(browser, product) {
  const page = await browser.newPage();

  try {
    console.log(`  [→]  ${product.name}`);
    console.log(`       ${product.url}`);

    await page.goto(product.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });

    // Wait briefly for any client-side stock status rendering
    await sleep(2_000);

    const bodyText = await page.evaluate(() => document.body.innerText);

    const available = IN_STOCK_PHRASES.some((phrase) => bodyText.includes(phrase));
    const unavailable = OUT_OF_STOCK_PHRASES.some((phrase) => bodyText.includes(phrase));

    // Determine which phrases were found (for logging)
    const foundPhrases = [...IN_STOCK_PHRASES, ...OUT_OF_STOCK_PHRASES].filter((p) =>
      bodyText.includes(p),
    );

    if (available) {
      const alreadyNotified = notifiedUrls.has(product.url);
      console.log(`  [✓]  IN STOCK — found: "${foundPhrases.join('", "')}"`);

      if (!alreadyNotified) {
        notifiedUrls.add(product.url);
        console.log(`  [🔔] Notification sent! Opening product page...`);
        alertUser(product);
      } else {
        console.log(`  [~]  Already notified — skipping repeat alert.`);
      }
    } else if (unavailable) {
      console.log(`  [✗]  Unavailable — found: "${foundPhrases.join('", "')}"`);
      // Reset so we notify again if it comes back
      notifiedUrls.delete(product.url);
    } else {
      console.log(`  [?]  Status unclear — no recognised phrases found.`);
      console.log(`       (Page may be behind a CAPTCHA or the URL may have changed.)`);
    }
  } catch (err) {
    console.error(`  [!]  Error checking product: ${err.message}`);
  } finally {
    await page.close();
  }
}

// ── Sweep ─────────────────────────────────────────────────────────────────────

async function runSweep() {
  const divider = '─'.repeat(62);
  console.log(`\n${divider}`);
  console.log(`[${timestamp()}]  Starting sweep — ${products.length} product(s) to check`);
  console.log(divider);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < products.length; i++) {
      await checkProduct(browser, products[i]);

      if (i < products.length - 1) {
        console.log(`\n  […]  Waiting ${DELAY_BETWEEN_CHECKS_MS / 1000}s before next product...\n`);
        await sleep(DELAY_BETWEEN_CHECKS_MS);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n[${timestamp()}]  Sweep complete. Next check in ${CHECK_INTERVAL_MS / 60_000} minutes.`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          StockWise — Smyths Toys Stock Checker           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  if (products.length === 0) {
    console.error('\n[!] No products defined. Edit smyths-checker/products.js to add URLs.\n');
    process.exit(1);
  }

  console.log(`\nMonitoring ${products.length} product(s) — checking every ${CHECK_INTERVAL_MS / 60_000} min.`);
  console.log('Press Ctrl+C to stop.\n');

  // Run once immediately on startup
  await runSweep();

  // Then repeat on the interval
  setInterval(() => {
    runSweep().catch((err) => {
      console.error(`[!] Sweep failed: ${err.message}`);
    });
  }, CHECK_INTERVAL_MS);
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
