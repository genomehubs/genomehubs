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

async function scrape(reports, directory) {
  let errors = {};
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
  });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  let downloadPath = directory;
  fs.mkdirSync(downloadPath, { recursive: true });
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath,
  });

  for (let { url, filename, size = 1000 } of reports) {
    console.error(` - generating ${filename}`);
    console.error(` - loading ${url}`);
    url = url.replace(/\/report\?/, "/search?").replace(/\bx=/, "query=");
    try {
      await page.setViewport({
        width: size,
        height: size,
        deviceScaleFactor: 2,
      });
      await page.goto(url, { waitUntil: "networkidle2" });

      const element = await page.waitForSelector("#report-panel");

      if (element) {
        element.scrollIntoView();
      }

      await page.waitForSelector("#report-loaded");

      const element2 = await page.waitForSelector(
        "#report-download-item > svg"
      );

      await element2.click();

      const element3 = await page.waitForSelector(
        "#report-download-button >>>> button"
      );

      await element3.click();

      await waitUntilDownload(page, "report.png");
    } catch (err) {
      console.error(` - unable to download report`);
      console.error(err);
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

const argv = process.argv.slice(2);
if (argv.length < 2) {
  process.exit(1);
}
let [inDir, outDir] = argv;

for (let directory of getDirectories(inDir)) {
  let configFile = `${inDir}/${directory}/config.yaml`;
  if (fs.existsSync(configFile)) {
    console.error(`Reading ${configFile}`);
    let config = yaml.load(fs.readFileSync(configFile));
    scrape(config, `${outDir}/${directory}`).then((errors) => {
      if (Object.keys(errors).length > 0) {
        console.error(
          `FAILED: ${Object.keys(errors).length} tests failed in ${directory}`
        );
        process.exit(1);
      } else {
        console.error(`PASSED: All tests passed for ${directory}`);
      }
    });
  }
}
