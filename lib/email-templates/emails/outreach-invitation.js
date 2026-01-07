/**
 * Outreach Invitation Email Template Stub
 */

module.exports = {
  subject: (data) => data?.subject || 'Invitation to Connect',
  template: (data) => `<html><body><p>${data?.message || 'Hello!'}</p></body></html>`,
  preheader: (data) => data?.preheader || 'Let\'s connect'
};
