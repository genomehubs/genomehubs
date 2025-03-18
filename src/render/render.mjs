import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

// Function to process each URL
async function processPage(url, htmlDir, htmlFile) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

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
    "body a:not(header a):not(footer a), body p:not(#searchBox):not(.MuiFormHelperText-root)",
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
    .replace(/<p>We use cookies[\s\S]+?<\/p>/gi, "")
    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi, "");

  await page.$eval(
    "#app",
    (element, modifiedMainContent) => {
      element.innerHTML = modifiedMainContent;
    },
    modifiedMainContent
  );

  // Extract the inner HTML of the body element
  const bodyContent = await page.$eval("body", (element) => element.innerHTML);

  // Wrap the body content in a full HTML document
  const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>GenomeHubs</title></head><body>${bodyContent}</body></html>`;

  fs.mkdirSync(htmlDir, { recursive: true });
  fs.writeFileSync(htmlFile, htmlContent);

  await browser.close();
}

// Get the directory path from the GH_PAGES_PATH environment variable
const staticPagesDir = process.env.GH_PAGES_PATH;

const generateFileList = (tabTree, root = "/", fileList) => {
  if (!fileList) {
    fileList = new Set();
  }
  for (let key of Object.keys(tabTree)) {
    if (tabTree[key] === null) {
      fileList.add(`${root}${key}`);
    } else if (Array.isArray(tabTree[key])) {
      fileList.add(`${root}${key}`);
      for (let link of tabTree[key]) {
        fileList.add(link);
      }
    } else {
      fileList.add(`${root}${key}`);
      fileList.add(
        ...generateFileList(tabTree[key], `${root}${key}/`, fileList)
      );
    }
  }
  return fileList;
};

const generateTabTree = (tabsFilePath = "./tabs.md") => {
  const tabsFileContent = fs.readFileSync(tabsFilePath, "utf8");
  const listEntries = tabsFileContent.match(/- .+/g);
  const tabTree = {};

  listEntries.forEach((entry) => {
    const hasChildren = entry.endsWith("+");
    const absolute = entry.substring(2).startsWith("/");
    const tabName = entry
      .substring(2)
      .replace(/[^\w\-]/g, "")
      .toLowerCase();
    if (hasChildren) {
      tabTree[tabName] = generateTabTree(
        tabsFilePath.replace(".md", `-${tabName}.md`)
      );
    } else {
      const subDir = tabsFilePath
        .replace(staticPagesDir, "")
        .replace(/tabs-*/, "")
        .replace(".md", "");
      const filePath = absolute
        ? path.join(staticPagesDir, `${tabName}.md`)
        : path.join(staticPagesDir, subDir, `${tabName}.md`);
      if (!fs.existsSync(filePath)) {
        return;
      }
      const fileContent = fs.readFileSync(filePath, "utf8");
      const links = (fileContent.match(/\[.*?\]\((.*?)\)/g) || [])
        .map((link) => {
          let m = link.match(/\[.*?\]\((.*?)\)/);
          return m && m[1].toLowerCase();
        })
        .filter(
          (link) =>
            link &&
            link.startsWith(subDir) &&
            fs.existsSync(path.join(staticPagesDir, `${link}.md`))
        );
      if (links && links.length > 0) {
        tabTree[tabName] = links;
      } else {
        tabTree[tabName] = null;
      }
    }
  });
  return tabTree;
};

const tabsFilePath = path.join(staticPagesDir, "tabs.md");
const tabTree = generateTabTree(tabsFilePath);
const fileList = ["/", ...generateFileList(tabTree)];

for (const location of fileList) {
  console.log(`Processing ${location}`);
  const htmlDir = path.join("./rendered", location);
  const htmlFile = path.join("./rendered", location, "index.html");
  const url = `https://goat.genomehubs.org${location}`;
  await processPage(url, htmlDir, htmlFile);
  console.log(`Processed ${url}`);
}

console.log("Crawler finished.");
