#!/usr/bin/env node

import fs from "fs";
import os from "os";
import puppeteer from "puppeteer";
import yaml from "js-yaml";

/**
 * Wait for a download to complete by monitoring the CDP session
 * Returns the file path once download completes
 */
async function waitForDownload(page, downloadPath, timeoutMs = 120000) {
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
        page.setDefaultTimeout(180000);
        page.setDefaultNavigationTimeout(180000);

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
            respUrl.includes("/api/v2/report") ||
            respUrl.includes("/api/v2/search")
          ) {
            if (resp.status() !== 200) {
              console.error(`[api error] ${resp.status()} ${respUrl}`);
            }
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
          { timeout: 180000 },
        );

        // Wait for report to load (wait for the #report-loaded marker to appear)
        await page.waitForFunction(
          () => {
            return document.querySelector("#report-loaded") !== null;
          },
          { timeout: 180000 },
        );

        console.error(`  report loaded, waiting for download button...`);

        // Now wait for the download button to be visible and clickable
        // The button appears after the report is fully loaded
        await page.waitForFunction(
          () => {
            const downloadIcon = document.querySelector(
              "#report-download-item",
            );
            if (!downloadIcon) return false;
            // Check if the element is actually visible in the DOM
            const rect = downloadIcon.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          },
          { timeout: 180000 },
        );

        console.error(`  download button visible, clicking download icon...`);

        // Click the download icon to show the download menu
        await page.click("#report-download-item");
        await awaitTimeout(500);

        // Wait for the download menu/button panel to appear
        console.error(`  waiting for download options...`);
        await page.waitForFunction(
          () => {
            const downloadButton = document.querySelector(
              "#report-download-button button",
            );
            if (!downloadButton) return false;
            const rect = downloadButton.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          },
          { timeout: 180000 },
        );

        // Get the first button in the download menu (usually PNG option)
        const buttons = await page.$$("#report-download-button button");
        if (buttons.length === 0) {
          throw new Error(
            "No download buttons found in #report-download-button",
          );
        }

        console.error(`  clicking first download format option...`);

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

        // Start waiting for download before clicking
        const downloadPromise = waitForDownload(page, downloadPath, 120000);

        // Click the first download button
        await buttons[0].click();

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
            const html = await page.content();
            fs.writeFileSync(`${downloadPath}/debug-${filename}.html`, html);
            await page.screenshot({
              path: `${downloadPath}/debug-${filename}.png`,
              fullPage: true,
            });
            console.error(`  saved debug output`);
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
