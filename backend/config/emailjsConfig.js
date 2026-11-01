// =====================================================================
// ExamSphere EmailJS Multi-Channel Configuration (Backend)
// Option 1: Direct File Configuration
//
// 1. FACULTY_AND_DOUBT_PUBLIC_KEY: Shared Public Key for Faculty & Doubt Support
// 2. STUDENT_PUBLIC_KEY: Separate Public Key for Students
// =====================================================================

// --- PUBLIC KEYS ---
// Public key 1: For Faculty and Doubt Support
const FACULTY_AND_DOUBT_PUBLIC_KEY = process.env.EMAILJS_FACULTY_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || 'D3VVFUSreFR_UXg3o';

// Public key 2: Separate Public key for Students
const STUDENT_PUBLIC_KEY = process.env.EMAILJS_STUDENTS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY || 'ENWrjn5pI5g_ByMeL';

// --- PRIVATE KEYS (Access Tokens - Required by EmailJS when Strict Mode is enabled) ---
// Private key 1: For Faculty and Doubt Support
const FACULTY_AND_DOUBT_PRIVATE_KEY = process.env.EMAILJS_FACULTY_PRIVATE_KEY || process.env.EMAILJS_PRIVATE_KEY || 'Luho_5TLdzeDT0p37xE5j';

// Private key 2: Separate Private key for Students
const STUDENT_PRIVATE_KEY = process.env.EMAILJS_STUDENTS_PRIVATE_KEY || process.env.EMAILJS_PRIVATE_KEY || 'qUV6QdMulojflAMVZr9nt';

const EMAILJS_CONFIG = {
  // 1. 🧑‍🏫 Faculty Notifications & Duty Roster
  FACULTY: {
    SERVICE_ID: process.env.EMAILJS_FACULTY_SERVICE_ID || 'service_xqz9a5f',    // <-- Paste your Faculty Service ID
    TEMPLATE_ID: process.env.EMAILJS_FACULTY_TEMPLATE_ID || 'template_3vubo2o',  // <-- Paste your Faculty Template ID
    PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY,
    PRIVATE_KEY: FACULTY_AND_DOUBT_PRIVATE_KEY
  },

  // 2. 🎓 Student Seating Allotment & Hall Tickets
  STUDENTS: {
    SERVICE_ID: process.env.EMAILJS_STUDENTS_SERVICE_ID || 'service_4tt14hg',    // <-- Paste your Students Service ID
    TEMPLATE_ID: process.env.EMAILJS_STUDENTS_TEMPLATE_ID || 'template_2n4zh9f',  // <-- Paste your Students Template ID
    PUBLIC_KEY: STUDENT_PUBLIC_KEY,    // Uses separate Student Public Key
    PRIVATE_KEY: STUDENT_PRIVATE_KEY
  },

  // 3. ❓ Urgent Doubt Support & Room Dispatch
  DOUBT_SUPPORT: {
    SERVICE_ID: process.env.EMAILJS_DOUBT_SERVICE_ID || 'service_32amx39',        // <-- Paste your Doubt Support Service ID
    TEMPLATE_ID: process.env.EMAILJS_DOUBT_TEMPLATE_ID || 'template_8bej99o',    // <-- Paste your Doubt Support Template ID
    PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY, // Uses Faculty & Doubt Public Key
    PRIVATE_KEY: FACULTY_AND_DOUBT_PRIVATE_KEY
  },

  // Key accessors
  FACULTY_AND_DOUBT_PUBLIC_KEY,
  STUDENT_PUBLIC_KEY,
  FACULTY_AND_DOUBT_PRIVATE_KEY,
  STUDENT_PRIVATE_KEY,
  PUBLIC_KEY: FACULTY_AND_DOUBT_PUBLIC_KEY,
  PRIVATE_KEY: FACULTY_AND_DOUBT_PRIVATE_KEY,

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

module.exports = EMAILJS_CONFIG;
