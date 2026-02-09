#!/usr/bin/env node

import fs from "fs";
import os from "os";
import puppeteer from "puppeteer";
import yaml from "js-yaml";

/**
 * Wait for a download to complete by monitoring the download directory
 */
async function waitForDownload(page, downloadPath, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Download timeout"));
    }, timeoutMs);

    const checkInterval = setInterval(() => {
      try {
        const files = fs.readdirSync(downloadPath);
        // Look for PNG files (excluding debug files)
        const pngFile = files.find(
          (f) => f.endsWith(".png") && !f.startsWith("debug-"),
        );
        if (pngFile) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve(`${downloadPath}/${pngFile}`);
        }
      } catch (e) {
        // Directory might not exist yet, continue checking
      }
    }, 500);
  });
}

const getDirectories = (parent) => {
  return fs
    .readdirSync(parent, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
};

const awaitTimeout = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay));

async function scrape(reports, directory) {
  let errors = {};
  let attempts = 5;
  const platform = os.platform();
  const chromeCandidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    platform === "linux" ? "/usr/bin/google-chrome" : undefined,
  ].filter(Boolean);
  const executablePath = chromeCandidates.find((p) => fs.existsSync(p));

  if (!executablePath) {
    throw new Error("Chrome not found");
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-sandbox",
    ],
  });

  let downloadPath = directory;
  fs.mkdirSync(downloadPath, { recursive: true });

  for (let { url, filename, size = 1000 } of reports) {
    console.error(` - generating ${filename}`);
    console.error(` - loading ${url}`);
    url = url.replace(/\/report\?/, "/search?").replace(/\bx=/, "query=");
    let success;

    for (let i = 0; i < attempts; i++) {
      let page;
      try {
        page = await browser.newPage();
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(60000);

        // Only log API responses and errors
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            console.error(`[console error] ${msg.text()}`);
          }
        });

        page.on("pageerror", (err) => {
          console.error(`[page error] ${err.message}`);
        });

        page.on("response", (resp) => {
          const respUrl = resp.url();
          if (
            (respUrl.includes("/api/v2/report") ||
              respUrl.includes("/api/v2/search")) &&
            resp.status() !== 200
          ) {
            console.error(`[api error] ${resp.status()} ${respUrl}`);
          }
        });

        // Setup download directory
        const client = await page.target().createCDPSession();
        await client.send("Page.setDownloadBehavior", {
          behavior: "allow",
          downloadPath,
        });

        // Set viewport
        await page.setViewport({
          width: size,
          height: size,
          deviceScaleFactor: 2,
        });

        // Navigate to UI
        console.error(`  attempt ${i + 1}/${attempts}`);
        await page.goto(url, { waitUntil: "networkidle2" });

        // Wait for report panel to exist and have content
        await page.waitForFunction(
          () => {
            const panel = document.querySelector("#report-panel");
            return panel && panel.offsetHeight > 100;
          },
          { timeout: 60000 },
        );

        // Wait for report to load (wait for the #report-loaded marker to appear)
        await page.waitForFunction(
          () => {
            return document.querySelector("#report-loaded") !== null;
          },
          { timeout: 60000 },
        );

        console.error(`  report loaded, waiting for download button...`);

        // Now wait for the report tools download span to be visible
        await page.waitForFunction(
          () => {
            const downloadSpan = document.querySelector(
              '[data-testid="report-tools-download-span"]',
            );
            if (!downloadSpan) {
              console.log("  [debug] report-tools-download-span not found");
              return false;
            }

            const rect = downloadSpan.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log("  [debug] report-tools-download-span visible");
              return true;
            }
            return false;
          },
          { timeout: 60000 },
        );

        console.error(
          `  download span visible, scrolling into view and clicking...`,
        );

        // Scroll into view
        await page.evaluate(() => {
          const span = document.querySelector(
            '[data-testid="report-tools-download-span"]',
          );
          if (span) {
            span.scrollIntoView({ behavior: "instant", block: "center" });
          }
        });

        await awaitTimeout(4500);

        // Trigger the click by finding and invoking the React onClick handler directly
        const clicked = await page.evaluate(() => {
          const span = document.querySelector(
            '[data-testid="report-tools-download-span"]',
          );
          if (!span) {
            console.log("  [debug] span not found");
            return false;
          }

          // Get the React fiber to access props
          const reactKey = Object.keys(span).find((key) =>
            key.startsWith("__reactProps"),
          );
          if (reactKey && span[reactKey] && span[reactKey].onClick) {
            console.log("  [debug] found React onClick, calling it");
            span[reactKey].onClick();
            return true;
          }

          // Fallback: try dispatching a click event
          console.log("  [debug] no React props found, trying click event");
          span.click();
          return true;
        });

        if (!clicked) {
          throw new Error(
            "Could not trigger click on report tools download span",
          );
        }

        console.error(`  triggered download span click`);

        // Wait longer for lazy-loaded component to load
        await awaitTimeout(2000);

        // Wait for the ReportDownload component to render and show buttons
        console.error(`  waiting for download options to appear...`);
        let componentFound = false;
        try {
          await page.waitForFunction(
            () => {
              // The download panel should be in the overlay that appears
              // Look specifically for the panel testid first
              const panel = document.querySelector(
                '[data-testid="report-download-panel"]',
              );
              if (!panel) {
                console.log("  [debug] report-download-panel not found yet");
                return false;
              }

              // Panel found - now check if buttons within it are visible
              const mainBtn = panel.querySelector(
                '[data-testid="report-download-main-button"]',
              );
              const menuToggle = panel.querySelector(
                '[data-testid="report-download-menu-toggle"]',
              );

              if (!mainBtn || !menuToggle) {
                console.log("  [debug] download buttons not found in panel");
                return false;
              }

              const mainVisible = mainBtn.getBoundingClientRect().height > 0;
              const toggleVisible =
                menuToggle.getBoundingClientRect().height > 0;

              if (mainVisible && toggleVisible) {
                console.log("  [debug] download buttons visible in panel");
                return true;
              }
              console.log("  [debug] buttons exist but not visible yet");
              return false;
            },
            { timeout: 60000 },
          );
          componentFound = true;
        } catch (e) {
          console.error(`  component wait failed: ${e.message}`);
        }

        if (!componentFound) {
          // Fallback: try to trigger export directly via window
          console.error(
            `  download panel did not appear, trying direct approach...`,
          );

          // Check if we can find and call the export function directly
          const directExportAttempt = await page.evaluate(() => {
            // Try to find the chart element and trigger screenshot
            const chartContainer = document.querySelector(
              "#report-panel [id*='chart'], #report-panel > div",
            );
            if (!chartContainer) {
              console.log("  [debug] could not find chart container");
              return false;
            }

            console.log("  [debug] found chart container");
            return true;
          });

          if (!directExportAttempt) {
            throw new Error(
              "Could not find download panel or chart after clicking",
            );
          }

          // Take screenshot of report panel for debugging
          console.error(`  taking debug screenshot of report panel...`);
          const reportPanel = await page.$("#report-panel");
          if (reportPanel) {
            const boundingBox = await reportPanel.boundingBox();
            if (boundingBox) {
              const existingFiles = fs.readdirSync(downloadPath);
              const pngFiles = existingFiles.filter((f) => f.endsWith(".png"));
              pngFiles.forEach((f) => {
                try {
                  fs.unlinkSync(`${downloadPath}/${f}`);
                } catch (e) {
                  // Ignore
                }
              });

              const debugScreenshotPath = `${downloadPath}/fallback-screenshot-${filename}`;
              await page.screenshot({
                path: debugScreenshotPath,
                clip: {
                  x: Math.max(0, boundingBox.x - 10),
                  y: Math.max(0, boundingBox.y - 10),
                  width: boundingBox.width + 20,
                  height: boundingBox.height + 20,
                },
              });

              console.error(
                `  saved fallback screenshot to ${debugScreenshotPath}`,
              );
            }
          }

          throw new Error(
            "Download panel failed to load (check fallback screenshot for debugging)",
          );
        }

        console.error(`  download options visible, clicking...`);

        // Click the main download button within the report download panel
        const clickedMain = await page.evaluate(() => {
          const panel = document.querySelector(
            '[data-testid="report-download-panel"]',
          );
          if (!panel) {
            console.log("  [debug] report-download-panel not found for click");
            return false;
          }

          const mainBtn = panel.querySelector(
            '[data-testid="report-download-main-button"]',
          );
          if (!mainBtn) {
            console.log("  [debug] main download button not found in panel");
            return false;
          }

          mainBtn.click();
          return true;
        });

        if (!clickedMain) {
          throw new Error("Download main button not found in panel");
        }

        // Clean up any previous download files
        const existingFiles = fs.readdirSync(downloadPath);
        const pngFiles = existingFiles.filter((f) => f.endsWith(".png"));
        pngFiles.forEach((f) => {
          try {
            fs.unlinkSync(`${downloadPath}/${f}`);
          } catch (e) {
            // Ignore
          }
        });

        // Start waiting for download (button was already clicked above)
        const downloadPromise = waitForDownload(page, downloadPath, 60000);

        // Wait for the download to complete
        console.error(`  waiting for file download...`);
        const downloadedFile = await downloadPromise;

        console.error(`  renaming to ${filename}...`);
        // Rename to target filename
        const targetPath = `${downloadPath}/${filename}`;
        fs.renameSync(downloadedFile, targetPath);

        console.error(`  ✓ saved to ${targetPath}`);
        success = true;
        break;
      } catch (error) {
        console.error(`  attempt ${i + 1} failed: ${error.message}`);

        // Save debug output on last attempt
        if (i === attempts - 1 && page) {
          try {
            // Check state of key elements
            const debugInfo = await page.evaluate(() => {
              const reportPanel = document.querySelector("#report-panel");
              const reportLoaded = document.querySelector("#report-loaded");
              const downloadItem = document.querySelector(
                "#report-download-item",
              );
              const downloadPanel = document.querySelector(
                '[data-testid="report-download-panel"]',
              );
              const mainButton = document.querySelector(
                '[data-testid="report-download-main-button"]',
              );

              return {
                reportPanel: {
                  exists: !!reportPanel,
                  visible: reportPanel ? reportPanel.offsetHeight > 0 : false,
                  height: reportPanel?.offsetHeight,
                },
                reportLoaded: {
                  exists: !!reportLoaded,
                },
                downloadItem: {
                  exists: !!downloadItem,
                  visible: downloadItem
                    ? downloadItem.getBoundingClientRect().height > 0
                    : false,
                },
                downloadPanel: {
                  exists: !!downloadPanel,
                  visible: downloadPanel
                    ? downloadPanel.offsetHeight > 0
                    : false,
                },
                mainButton: {
                  exists: !!mainButton,
                  visible: mainButton
                    ? mainButton.getBoundingClientRect().height > 0
                    : false,
                },
                allTestIds: Array.from(
                  document.querySelectorAll("[data-testid]"),
                )
                  .map((el) => el.getAttribute("data-testid"))
                  .slice(0, 20),
              };
            });

            console.error(`  [debug] element state:`);
            console.error(JSON.stringify(debugInfo, null, 2));

            const html = await page.content();
            fs.writeFileSync(`${downloadPath}/debug-${filename}.html`, html);
            await page.screenshot({
              path: `${downloadPath}/debug-${filename}.png`,
              fullPage: true,
            });
            console.error(
              `  saved debug output to debug-${filename}.{html,png}`,
            );
          } catch (debugError) {
            console.error(
              `  failed to save debug output: ${debugError.message}`,
            );
          }
        }

        if (i < attempts - 1) {
          await awaitTimeout(2000);
        }
      } finally {
        if (page) {
          try {
            await page.close();
          } catch (e) {
            // Ignore
          }
        }
      }
    }

    if (!success) {
      console.error(` ✗ unable to download report`);
      errors[filename] = "download";
    }
  }

  await browser.close();
  return errors;
}

const loopTestDirs = async (parentDir) => {
  for (let directory of getDirectories(parentDir)) {
    let configFile = `${parentDir}/${directory}/config.yaml`;
    if (fs.existsSync(configFile)) {
      console.error(`Reading ${configFile}`);
      let config = yaml.load(fs.readFileSync(configFile));
      let errors = await scrape(config, `${outDir}/${directory}`);
      if (Object.keys(errors).length > 0) {
        console.error(
          `FAILED: ${Object.keys(errors).length} tests failed in ${directory}`,
        );
        process.exit(1);
      } else {
        console.error(`PASSED: All tests passed for ${directory}`);
      }
    }
  }
};

const argv = process.argv.slice(2);
if (argv.length < 2) {
  process.exit(1);
}
let [inDir, outDir] = argv;

loopTestDirs(inDir);
