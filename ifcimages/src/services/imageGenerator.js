// src/services/imageGenerator.js

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Ensures the temp and output directories exist.
 */
async function ensureDirectories() {
  const dirs = [
    path.join(__dirname, '../temp'),
    path.join(__dirname, '../output'),
  ];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Launches Puppeteer, navigates to the viewer, and captures PNG snapshots
 * of all elements matching the specified IFC type.
 *
 * @param {string} ifcPath - Local filesystem path to the uploaded IFC file.
 * @param {string} ifcType - IFC entity type to snapshot (e.g. 'IfcWall').
 * @returns {Promise<Array<{elementId: number, type: string, path: string}>>}
 */
async function generateImagesByType(ifcPath, ifcType) {
  console.log(`Generating images for IFC type: ${ifcType}`);
  await ensureDirectories();

  const port = process.env.PORT || 3000;
  const host = `http://localhost:${port}`;
  const uploadUrl = `/uploads/${encodeURIComponent(path.basename(ifcPath))}`;
  const viewerUrl = `${host}/temp/viewer.html?mode=images&ifc=${uploadUrl}&type=${encodeURIComponent(ifcType)}`;

  console.log(`Navigating to viewer URL: ${viewerUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.goto(viewerUrl, { waitUntil: 'networkidle0', timeout: 120000 });

    const images = await page.evaluate(() => {
      if (window._error) throw new Error(window._error);
      return window._images || [];
    });

    console.log(`Captured ${images.length} images from viewer`);

    const results = [];
    for (const { elementId, type, imageData } of images) {
      const filename = `${type}_${elementId}.png`;
      const outputPath = path.join(__dirname, '../output', filename);
      const base64 = imageData.replace(/^data:image\/png;base64,/, '');
      await fs.writeFile(outputPath, base64, 'base64');
      results.push({ elementId, type, path: outputPath });
    }

    return results;
  } finally {
    await browser.close();
  }
}

/**
 * Launches Puppeteer to list all unique IFC entity types in the model.
 *
 * @param {string} ifcPath - Local filesystem path to the uploaded IFC file.
 * @returns {Promise<string[]>}
 */
async function getAllIFCTypes(ifcPath) {
  console.log('Retrieving all IFC types from model');
  await ensureDirectories();

  const port = process.env.PORT || 3000;
  const host = `http://localhost:${port}`;
  const uploadUrl = `/uploads/${encodeURIComponent(path.basename(ifcPath))}`;
  const viewerUrl = `${host}/temp/viewer.html?mode=types&ifc=${uploadUrl}`;

  console.log(`Navigating to viewer URL for types: ${viewerUrl}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    await page.goto(viewerUrl, { waitUntil: 'networkidle0', timeout: 120000 });

    const types = await page.evaluate(() => {
      if (window._error) throw new Error(window._error);
      return window._types || [];
    });

    console.log(`Found IFC types: ${types.join(', ')}`);
    return types;
  } finally {
    await browser.close();
  }
}

module.exports = {
  generateImagesByType,
  getAllIFCTypes,
};
