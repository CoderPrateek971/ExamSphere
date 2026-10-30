import emailjs from '@emailjs/browser';

// =====================================================================
// PERMANENT EMAILJS CONFIGURATION (Hardcoded in code, hidden from UI)
// =====================================================================
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_xqz9a5f', // Connected to examsphereadmin@gmail.com
  TEMPLATE_ID: 'template_3vubo2o',
  PUBLIC_KEY: 'D3VVFUSreFR_UXg3o'
};

export const emailService = {
  getConfig() {
    return {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY
    };
  },

  isConfigured() {
    const config = this.getConfig();
    return Boolean(
      config.serviceId && 
      config.templateId && 
      config.publicKey &&
      !config.publicKey.includes('public_key_here')
    );
  },

  /**
   * Send automated duty assignment email to faculty using EmailJS
   * 
   * @param {Object} params
   * @param {string} params.from_name  - e.g. "Exam Controller Admin"
   * @param {string} params.from_email - e.g. "admin@examsphere.edu"
   * @param {string} params.to_name    - e.g. "Dr. Shilpa Mahajan"
   * @param {string} params.to_email   - e.g. "shilpa.mahajan@bmu.edu.in"
   * @param {string} params.exam_name  - e.g. "CSE3005 Software Engineering End-Term"
   * @param {string} params.course_code - e.g. "CSE3005"
   * @param {string} params.room_number - e.g. "E2-101"
   * @param {string} params.exam_date  - e.g. "2026-11-20"
   * @param {string} params.start_time - e.g. "09:30 AM"
   * @param {string} params.end_time   - e.g. "12:30 PM"
   * @param {string} params.message    - Custom message text
   */
  async sendDutyEmail(params) {
    const config = this.getConfig();

    const templateParams = {
      from_name: params.from_name || 'Exam Controller Admin',
      from_email: params.from_email || 'admin@examsphere.edu',
      to_name: params.to_name,
      to_email: params.to_email,
      email: params.to_email, // Alias in case template uses {{email}}
      user_email: params.to_email, // Alias in case template uses {{user_email}}
      subject: `Exam Duty Assignment: ${params.exam_name} [${params.room_number}]`,
      exam_name: params.exam_name,
      course_code: params.course_code || 'EXAM',
      room_number: params.room_number,
      exam_date: params.exam_date,
      time_slot: `${params.start_time} - ${params.end_time}`,
      start_time: params.start_time,
      end_time: params.end_time,
      message: params.message || `Dear ${params.to_name},\n\nYou have been assigned as Invigilator for ${params.exam_name} in Room ${params.room_number} on ${params.exam_date} (${params.start_time} - ${params.end_time}).\n\nPlease report to the examination hall 20 minutes prior to the start time.\n\nRegards,\nExam Controller Administration\nExamSphere`
    };

    // If live credentials are provided, send via EmailJS
    if (this.isConfigured()) {
      try {
        const response = await emailjs.send(
          config.serviceId,
          config.templateId,
          templateParams,
          config.publicKey
        );
        return {
          success: true,
          mode: 'LIVE_EMAILJS',
          status: response.status,
          text: response.text,
          templateParams
        };
      } catch (error) {
        console.error('EmailJS Send Error:', error);
        throw new Error(error.text || error.message || 'Failed to send email via EmailJS.');
      }
    } else {
      // Simulation / Demo Mode when user hasn't input keys yet
      console.log('[EmailJS Simulation] Email dispatched with parameters:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800)); // simulate network delay
      return {
        success: true,
        mode: 'SIMULATION',
        status: 200,
        text: 'Simulation: Email formatted & ready. Configure EmailJS keys to deliver to real inboxes.',
        templateParams
      };
    }
  }
};
