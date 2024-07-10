import { PuppeteerCrawler } from "@crawlee/puppeteer";
import fs from "fs";

const outputFileName = "output.pdf";

// Create an instance of the PuppeteerCrawler class - a crawler
// that automatically loads the URLs in headless Chrome / Puppeteer.
const crawler = new PuppeteerCrawler({
  // Here you can set options that are passed to the launchPuppeteer() function.
  launchContext: {
    launchOptions: {
      headless: true,
      // Other Puppeteer options
    },
  },

  // Stop crawling after several pages
  maxRequestsPerCrawl: 50,

  // This function will be called for each URL to crawl.
  // Here you can write the Puppeteer scripts you are familiar with,
  // with the exception that browsers and pages are automatically managed by Crawlee.
  // The function accepts a single parameter, which is an object with the following fields:
  // - request: an instance of the Request class with information such as URL and HTTP method
  // - page: Puppeteer's Page object (see https://pptr.dev/#show=api-class-page)
  async requestHandler({ pushData, request, page, enqueueLinks, log }) {
    log.info(`Processing ${request.url}...`);

    // A function to be evaluated by Puppeteer within the browser context.
    // await new Promise((r) => setTimeout(r, 5000));

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

    // Save the HTML for the page
    // Select the app div
    // const appDiv = await page.$eval("#app", (element) => element.outerHTML);
    // Select all p and a elements
    const elements = await page.$$eval(
      "a:not(header a):not(footer a), p:not(#searchBox):not(.MuiFormHelperText-root)",
      (elements) => elements.map((element) => element.outerHTML)
    );

    // Create a new top-level div
    const topLevelDiv = "<div>" + elements.join("") + "</div>";
    const modifiedTopLevelDiv = topLevelDiv
      .replace(/\n/g, "")
      .replace(/\s+/g, " ")
      .replace(/>\s+/g, ">")
      .replace(/\s+</g, "<")
      .replace(/([^>])<span(\b[^>]*)>/gi, "$1 <span$2>")
      .replace(/<\/span>([^<])/gi, "</span> $1")
      .replace(/([^>])<a(\b[^>]*)>/gi, "$1 <a$2>")
      .replace(/<\/a>([^<])/gi, "</a> $1")
      .replace(/<p>We use cookies.+?<\/p>/gi, "")
      .replace(/<svg\b[^>]*>.*?<\/svg>/gi, "");

    // Save the modified HTML to a file
    fs.writeFileSync("page.html", modifiedTopLevelDiv);
    // Save the HTML to a file
    // const modifiedAppDiv = appDiv
    //   .replace(/\n/g, "")
    //   .replace(/\s+/g, " ")
    //   .replace(/>\s+/g, ">")
    //   .replace(/\s+</g, "<");
    // fs.writeFileSync("page.html", modifiedAppDiv);

    // fs.writeFileSync("page.html", appDiv);

    // await page.pdf({
    //   path: outputFileName,
    //   displayHeaderFooter: true,
    //   headerTemplate: "",
    //   footerTemplate: "",
    //   printBackground: true,
    //   format: "A4",
    // });

    // Find a link to the next page and enqueue it if it exists.
    const infos = await enqueueLinks({
      selector: ".morelink",
    });

    if (infos.processedRequests.length === 0) {
      log.info(`${request.url} is the last page!`);
    }
  },

  // This function is called if the page processing failed more than maxRequestRetries+1 times.
  failedRequestHandler({ request, log }) {
    log.error(`Request ${request.url} failed too many times.`);
  },
});

await crawler.addRequests(["https://goat.genomehubs.org/projects/ebp"]);

// Run the crawler and wait for it to finish.
await crawler.run();

console.log("Crawler finished.");
