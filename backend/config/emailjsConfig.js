// =====================================================================
// ExamSphere EmailJS Shared Configuration (Module 6)
// This file is tracked in git so all developers have access to the
// active EmailJS service without needing local .env entries.
// =====================================================================

const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.EMAILJS_SERVICE_ID || 'service_32amx39',
  TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID || 'template_8bej99o',
  PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY || 'D3VVFUSreFR_UXg3o',
  PRIVATE_KEY: process.env.EMAILJS_PRIVATE_KEY || ''
};

module.exports = EMAILJS_CONFIG;

