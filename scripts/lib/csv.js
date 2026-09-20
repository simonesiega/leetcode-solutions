'use strict';

// Small RFC 4180-style CSV parser for external company source files.

/**
 * Parse CSV text into rows while preserving quoted commas, escaped quotes, and empty fields.
 * @param {string} input - Complete CSV document.
 * @returns {string[][]}
 */
function parseCsv(input) {
  if (typeof input !== 'string') throw new Error('CSV input must be a string.');
  // A UTF-8 BOM is metadata, not part of the first header name.
  const content = input.startsWith('\uFEFF') ? input.slice(1) : input;
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;

  const finishField = () => {
    row.push(field);
    field = '';
    afterQuote = false;
  };
  const finishRow = () => {
    finishField();
    // Ignore records with no content; empty fields in every other record remain positional.
    if (row.some((value) => value !== '')) rows.push(row);
    row = [];
  };

  for (let index = 0; index < content.length; index++) {
    const character = content[index];
    if (quoted) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          quoted = false;
          afterQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote && character !== ',' && character !== '\n' && character !== '\r') {
      throw new Error('CSV input contains characters after a closing quote.');
    }
    if (character === '"') {
      if (field !== '') throw new Error('CSV input contains a quote inside an unquoted field.');
      quoted = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && content[index + 1] === '\n') index++;
      finishRow();
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error('CSV input contains an unterminated quoted field.');
  if (field !== '' || row.length || afterQuote) finishRow();
  return rows;
}

module.exports = { parseCsv };
