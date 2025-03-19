import fs from "fs";
import path from "path";

// Get the directory path from the GH_PAGES_PATH environment variable
const staticPagesDir =
  process.env.GH_PAGES_PATH || "src/genomehubs-ui/src/client/static";

// Get the url from the GH_URL environment variable
const ghUrl = process.env.GH_URL || "https://goat.genomehubs.org";

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

// replace FILE_LIST in render.mjs with the generated list
// use render.mjs is in the same directory as this script
const __dirname = path.dirname(new URL(import.meta.url).pathname);
let renderPath = path.join(__dirname, "render.mjs");
let renderContent = fs.readFileSync(renderPath, "utf8");
renderContent = renderContent
  .replace(
    /const fileList = \[.*\];/,
    `const fileList = ${JSON.stringify(fileList, null, 2)};`
  )
  .replace(
    /const ghUrl = "https:\/\/goat.genomehubs.org";/,
    `const ghUrl = "${ghUrl}";`
  );

fs.writeFileSync(renderPath, renderContent, "utf8");

console.log("Updated file list in render.mjs");
