const puppeteer = require("puppeteer");

async function generatePDFFromHTML(htmlContent, outputPath) {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new"
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return outputPath;
}

module.exports = { generatePDFFromHTML };
