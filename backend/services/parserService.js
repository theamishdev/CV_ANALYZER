const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract raw text content from PDF buffer.
 */
async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * Extract raw text content from DOCX buffer.
 */
async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`DOCX extraction failed: ${error.message}`);
  }
}

module.exports = {
  parsePdf,
  parseDocx
};
