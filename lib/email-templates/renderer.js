/**
 * Email Template Renderer Stub
 * Minimal implementation for bot server to load
 */

function renderEmailTemplate(templateName, data) {
  // Stub implementation - returns basic HTML
  return `<html><body><h1>${templateName}</h1><p>${JSON.stringify(data)}</p></body></html>`;
}

module.exports = {
  renderEmailTemplate
};
