// src/utils/ocrUtils.js // बदला गया

import { createWorker } from 'tesseract.js';

const worker = await createWorker('eng');

export const performOCR = async (imageSrc) => {
  if (!worker) {
    console.error("Tesseract worker not initialized.");
    return { text: "", confidence: 0 };
  }
  const { data: { text, confidence } } = await worker.recognize(imageSrc);
  return { text, confidence: confidence || 0 };
};

export const cleanText = (text) => {
  let cleaned = text.replace(/[^a-zA-Z0-9.,\-\s:%]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

export const extractMinerals = (text) => {
  const minerals = {};
  const lines = text.split('\n');
  const mineralKeywords = {
    calcium: ['calcium', 'ca', 'calc', 'calcium'],
    magnesium: ['magnesium', 'mg'],
    potassium: ['potassium', 'k'],
    sodium: ['sodium', 'na'],
    bicarbonate: ['bicarbonate', 'hco3'],
    chloride: ['chloride', 'cl'],
    sulphate: ['sulphate', 'sulfate', 'so4'],
    nitrate: ['nitrate', 'no3'],
    fluoride: ['fluoride', 'f'],
    tds: ['tds', 'total dissolved solids'],
    ph: ['ph'],
  };

  lines.forEach(line => {
    line = line.toLowerCase();

    for (const mineralKey in mineralKeywords) {
      const keywords = mineralKeywords[mineralKey];
      for (const keyword of keywords) {
        if (line.includes(keyword)) {
          const match = line.match(/(\d+([.,]\d+)?)\s*(mg|ppm|g|µg|ug|ml|l|units)?/);

          if (match && match[1]) {
            let value = parseFloat(match[1].replace(',', '.'));
            let unit = match[3] ? match[3].toLowerCase() : 'mg';

            if (unit === 'g') {
              value *= 1000;
              unit = 'mg';
            } else if (unit === 'µg' || unit === 'ug') {
              value /= 1000;
              unit = 'mg';
            } else if (unit === 'ppm' && mineralKey !== 'ph') {
                unit = 'mg';
            }
            if (mineralKey === 'ph') {
                unit = 'pH units';
            }

            minerals[mineralKey] = value;
            return;
          }
        }
      }
    }
  });
  return minerals;
};