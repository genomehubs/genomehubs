#!/usr/bin/env node

import fs from "fs";
import puppeteer from "puppeteer";
import yaml from "js-yaml";

async function waitUntilDownload(page, fileName = "") {
  return new Promise((resolve, reject) => {
    page._client().on("Page.downloadProgress", (e) => {
      // or 'Browser.downloadProgress'
      if (e.state === "completed") {
        resolve(fileName);
      } else if (e.state === "canceled") {
        reject();
      }
    });
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
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
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
      } catch (error) {
        console.log(`caught -3 ${i}`);
        console.log(error);
        continue;
      }
      let client;
      try {
        client = await page.target().createCDPSession();
      } catch (error) {
        console.log(`caught -2 ${i}`);
        console.log(error);
        continue;
      }
      try {
        await client.send("Page.setDownloadBehavior", {
          behavior: "allow",
          downloadPath,
        });
      } catch (error) {
        console.log(`caught -1 ${i}`);
        console.log(error);
        continue;
      }

      try {
        await page.setViewport({
          width: size,
          height: size,
          deviceScaleFactor: 2,
        });
      } catch (error) {
        console.log(`caught 0 ${i}`);
        console.log(error);
        continue;
      }
      try {
        await page.goto(url, { waitUntil: "networkidle2" });
      } catch (error) {
        console.log(`caught 1 ${i}`);
        console.log(error);
        continue;
      }

      await awaitTimeout(1000);

      let element;
      try {
        element = await page.waitForSelector("#report-panel");
      } catch (error) {
        console.log(`caught 2 ${i}`);
        console.log(error);
        continue;
      }

      if (element) {
        element.scrollIntoView();
      } else {
        continue;
      }

      try {
        await page.waitForSelector("#report-loaded");
      } catch (error) {
        console.log(`caught 3 ${i}`);
        console.log(error);
        continue;
      }

      let element2;
      try {
        element2 = await page.waitForSelector("#report-download-item > svg");
      } catch (error) {
        console.log(`caught 4 ${i}`);
        console.log(error);
        continue;
      }

      try {
        await element2.click();
      } catch (error) {
        console.log(`caught 5 ${i}`);
        console.log(error);
        continue;
      }

      let element3;
      try {
        element3 = await page.waitForSelector(
          "#report-download-button >>>> button"
        );
      } catch (error) {
        console.log(`caught 6 ${i}`);
        console.log(error);
        continue;
      }

      try {
        await element3.click();
      } catch (error) {
        console.log(`caught 7 ${i}`);
        console.log(error);
        continue;
      }

      try {
        await waitUntilDownload(page, "report.png");
      } catch (error) {
        console.log(`caught 8 ${i}`);
        console.log(error);
        continue;
      }
      success = true;
      break;
    }
    if (!success) {
      console.error(" - unable to download report");
      errors[filename] = "download";
      continue;
    }
    if (filename.match(/^[-\w\d\.]+$/)) {
      try {
        fs.renameSync(
          `${downloadPath}/report.png`,
          `${downloadPath}/${filename}`
        );
        console.error(` - renamed to ${downloadPath}/${filename}`);
      } catch (err) {
        console.error(` - unable to rename to ${downloadPath}/${filename}`);
        console.error(err);
        errors[filename] = "rename";
      }
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
          `FAILED: ${Object.keys(errors).length} tests failed in ${directory}`
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
