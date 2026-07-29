const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

/**
 * Generate a PDF from structured resume data using Handlebars and Puppeteer.
 */
async function generatePdfFromTemplate(cvData) {
  // Read Handlebars template
  const templatePath = path.join(__dirname, '..', 'templates', 'resume.hbs');
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  
  // Compile Handlebars template with CVData data structure
  const compileTemplate = handlebars.compile(templateHtml);
  const finalHtml = compileTemplate(cvData);

  // Launch Puppeteer browser instance
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    
    // Set HTML page context and wait until fonts load
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    
    // Compile PDF binary stream
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      }
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

module.exports = {
  generatePdfFromTemplate
};
