import { dir } from "console";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import yaml from "js-yaml";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const downloadPath = path.join(__dirname, "download");

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
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  const client = await page.target().createCDPSession();

  let downloadPath;
  if (directory.match(/^[\w\d]+$/)) {
    downloadPath = `./downloads/${directory}`;
  } else {
    downloadPath = "./downloads";
  }
  fs.mkdirSync(downloadPath, { recursive: true });
  await client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath,
  });

  for (let { url, filename, size = 1000 } of reports) {
    console.error(` - loading ${url}`);
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

      // Query for an element handle.
      const element1 = await page.waitForSelector("#report-loaded");

      // Query for an element handle.
      const element2 = await page.waitForSelector(
        "#report-download-item > svg"
      );

      // Do something with element...
      await element2.click();

      // Query for an element handle.
      const element3 = await page.waitForSelector(
        "#report-download-button >>>> button"
      );

      // Do something with element...
      await element3.click();

      await waitUntilDownload(page, "report.png");
    } catch (err) {
      console.error(` - unable to download report`);
      console.error(err);
      continue;
    }
    if (filename.match(/^[\w\d\.]+$/)) {
      try {
        fs.renameSync(
          `${downloadPath}/report.png`,
          `${downloadPath}/${filename}`
        );
        console.error(` - renamed to ${downloadPath}/${filename}`);
      } catch (err) {
        console.error(` - unable to rename to ${downloadPath}/${filename}`);
        console.error(err);
      }
    }
  }

  await browser.close();
}

let root = "./tests/integration_tests/ui";

for (let directory of getDirectories(root)) {
  let configFile = `${root}/${directory}/config.yaml`;
  if (fs.existsSync(configFile)) {
    console.error(`Reading ${configFile}`);
    let config = yaml.load(fs.readFileSync(configFile));
    scrape(config, `${root}/${directory}`).then((data) => {});
  }
}
