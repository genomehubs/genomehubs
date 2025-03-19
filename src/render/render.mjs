import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

// Function to process each URL
async function processPage(url, htmlDir, htmlFile, indexHtml) {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser",
  });
  const page = await browser.newPage();
  const response = await page.goto(url, { waitUntil: "networkidle2" });

  if (response.status() !== 200) {
    console.error(`Failed to load ${url}`);
    await browser.close();
    return;
  }

  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const scrollInterval = setInterval(() => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 100);

      const idleTimeout = setTimeout(() => {
        clearInterval(scrollInterval);
        resolve();
      }, 10000);

      window.addEventListener("load", () => {
        clearInterval(scrollInterval);
        clearTimeout(idleTimeout);
        resolve();
      });
    });
  });

  const elements = await page.$$eval(
    "#app a:not(header a):not(footer a), #app p:not(#searchBox):not(.MuiFormHelperText-root)",
    (elements) => elements.map((element) => element.outerHTML)
  );

  const mainContent = elements.join("");
  const modifiedMainContent = mainContent
    .replace(/\n/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .replace(/([^>])<span(\b[^>]*)>/gi, "$1 <span$2>")
    .replace(/<\/span>([^<])/gi, "</span> $1")
    .replace(/([^>])<a(\b[^>]*)>/gi, "$1 <a$2>")
    .replace(/<\/a>([^<])/gi, "</a> $1")
    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi, "");

  if (mainContent.match(/<p>\/static\/\S+\.md not found<\/p>/)) {
    console.error(`Failed to load ${url}`);
    await browser.close();
    return;
  }

  await page.$eval(
    "#app",
    (element, modifiedMainContent) => {
      element.innerHTML = modifiedMainContent;
    },
    modifiedMainContent
  );

  // Extract the inner HTML of the body element
  const appContent = await page.$eval("#app", (element) => element.innerHTML);

  // replace div id="app" with div id="app" innerHTML={appContent}
  const htmlContent = indexHtml.replace(
    '<div id=app style="height:100%; min-height:100%;"></div>',
    `<div id="app" style="height:100%; min-height:100%;">${appContent}</div>`
  );

  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(htmlFile, htmlContent);

  await browser.close();
}

const fileList = [];

const ghUrl = "https://goat.genomehubs.org";

// fetch index.html as plain text
const indexUrl = `${ghUrl}/`;
const indexHtml = await (await fetch(indexUrl)).text();

for (const location of fileList.slice(0, 2)) {
  console.log(`Processing ${location}`);
  const htmlDir = path.join("./rendered", location);
  const htmlFile = path.join("./rendered", location, "index.html");
  const url = `${ghUrl}${location}`;
  await processPage(url, htmlDir, htmlFile, indexHtml);
  console.log(`Processed ${url}`);
}

console.log("Crawler finished.");
