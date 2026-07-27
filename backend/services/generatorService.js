const PizZip = require('pizzip');

/**
 * Replaces search text inside the DOCX document.xml archive directly.
 * This guarantees that original font styles, headers, colors, and layouts are preserved.
 */
function replaceRawTextInDocx(docxBuffer, replacements) {
  const zip = new PizZip(docxBuffer);
  let docXml = zip.file("word/document.xml").asText();

  // Apply key-value replacements (e.g., replacement of old keywords/metrics with optimized ones)
  for (const [search, replace] of Object.entries(replacements)) {
    if (!search || !replace) continue;
    
    // Escape XML character codes for safe layout building
    const safeReplace = replace
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    // Build regex to replace all matches in XML nodes
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedSearch, 'g');
    docXml = docXml.replace(regex, safeReplace);
  }

  // Re-inject updated XML content back to Zip file index
  zip.file("word/document.xml", docXml);
  
  // Export binary node buffer
  return zip.generate({ type: 'nodebuffer' });
}

module.exports = {
  replaceRawTextInDocx
};
