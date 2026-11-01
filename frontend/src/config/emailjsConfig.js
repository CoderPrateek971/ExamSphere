// =====================================================================
// ExamSphere EmailJS Multi-Channel Configuration (Frontend)
// Option 1: Direct File Configuration
//
// 1. FACULTY_AND_DOUBT_PUBLIC_KEY: Shared Public Key for Faculty & Doubt Support
// 2. STUDENT_PUBLIC_KEY: Separate Public Key for Students
// =====================================================================

// --- PUBLIC KEYS ---
// Public key 1: For Faculty and Doubt Support
export const FACULTY_AND_DOUBT_PUBLIC_KEY = 'D3VVFUSreFR_UXg3o'; // <-- Paste your Faculty & Doubt Public Key here

// Public key 2: Separate Public key for Students
export const STUDENT_PUBLIC_KEY = 'D3VVFUSreFR_UXg3o';           // <-- Paste your Student Public Key here

export const EMAILJS_CONFIG = {
  // 1. 🧑‍🏫 Faculty Notifications & Duty Roster
  FACULTY: {
    SERVICE_ID: 'service_32amx39',    // <-- Paste your Faculty Service ID here
    TEMPLATE_ID: 'template_8bej99o',  // <-- Paste your Faculty Template ID here
    PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY
  },

  // 2. 🎓 Student Seating Allotment & Hall Tickets
  STUDENTS: {
    SERVICE_ID: 'service_32amx39',    // <-- Paste your Students Service ID here
    TEMPLATE_ID: 'template_8bej99o',  // <-- Paste your Students Template ID here
    PUBLIC_KEY: STUDENT_PUBLIC_KEY    // Uses separate Student Public Key
  },

  // 3. ❓ Urgent Doubt Support & Room Dispatch
  DOUBT_SUPPORT: {
    SERVICE_ID: 'service_32amx39',    // <-- Paste your Doubt Support Service ID here
    TEMPLATE_ID: 'template_8bej99o',  // <-- Paste your Doubt Support Template ID here
    PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY // Uses Faculty & Doubt Public Key
  },

  // Public key accessors
  FACULTY_AND_DOUBT_PUBLIC_KEY,
  STUDENT_PUBLIC_KEY,
  PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY,

  // Fallbacks for backwards compatibility
  SERVICE_ID: 'service_32amx39',
  TEMPLATE_ID: 'template_8bej99o',

  /**
   * Helper to retrieve credentials for a specific channel
   * @param {'FACULTY'|'STUDENTS'|'DOUBT_SUPPORT'|string} channel 
   */
  getCredentials(channel = 'FACULTY') {
    const ch = (channel || 'FACULTY').toUpperCase().replace(/[-\s]/g, '_');
    if (ch.includes('STUDENT')) {
      return this.STUDENTS;
    }
    if (ch.includes('DOUBT')) {
      return this.DOUBT_SUPPORT;
    }
    return this.FACULTY;
  }
};

export default EMAILJS_CONFIG;
