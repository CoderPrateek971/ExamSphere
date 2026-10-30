import emailjs from '@emailjs/browser';

// =====================================================================
// PERMANENT EMAILJS CONFIGURATION (Hardcoded in code, hidden from UI)
// =====================================================================
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_4tt14hg',
  FACULTY_TEMPLATE_ID: 'template_2n4zh9f',
  STUDENT_TEMPLATE_ID: 'template_2n4zh9f',
  TEMPLATE_ID: 'template_2n4zh9f',
  PUBLIC_KEY: 'ENWrjn5pI5g_ByMeL'
};

export const emailService = {
  getConfig() {
    return {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      facultyTemplateId: EMAILJS_CONFIG.FACULTY_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID,
      studentTemplateId: EMAILJS_CONFIG.STUDENT_TEMPLATE_ID || EMAILJS_CONFIG.TEMPLATE_ID,
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

    const targetTemplate = config.facultyTemplateId || config.templateId;

    // If live credentials are provided, send via EmailJS
    if (this.isConfigured()) {
      try {
        const response = await emailjs.send(
          config.serviceId,
          targetTemplate,
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
      console.log('[EmailJS Simulation] Faculty Email dispatched with parameters:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800)); // simulate network delay
      return {
        success: true,
        mode: 'SIMULATION',
        status: 200,
        text: 'Simulation: Email formatted & ready. Configure EmailJS keys to deliver to real inboxes.',
        templateParams
      };
    }
  },

  /**
   * Send automated exam seating allotment notification to student using EmailJS
   * 
   * @param {Object} params
   * @param {string} params.student_email / params.to_email - e.g. "aman.sharma@college.edu"
   * @param {string} params.student_name / params.to_name   - e.g. "Aman Sharma"
   * @param {string} params.exam_name                       - e.g. "Software Engineering"
   * @param {string} params.room_number / params.room       - e.g. "E2-101"
   * @param {string} params.seat_number / params.seat       - e.g. "Desk 14"
   * @param {string} [params.exam_date]                     - e.g. "2026-11-20"
   * @param {string} [params.time_slot]                     - e.g. "09:30 AM - 12:30 PM"
   * @param {string} [params.subject]                       - Custom subject line
   * @param {string} [params.message]                       - Custom message text
   */
  async sendStudentSeatingEmail(params) {
    const config = this.getConfig();

    const recipientEmail = params.student_email || params.to_email || params.email;
    const recipientName = params.student_name || params.to_name || 'Student';
    const examName = params.exam_name || params.exam || 'Upcoming Examination';
    const roomNumber = params.room_number || params.room || 'TBD';
    const seatNumber = params.seat_number || params.seat || 'TBD';
    const examDate = params.exam_date || 'Upcoming Examination Date';
    const timeSlot = params.time_slot || (params.start_time && params.end_time ? `${params.start_time} - ${params.end_time}` : 'Scheduled Time Slot');

    const defaultSubject = `Exam Seating Allotment: ${examName} [Room ${roomNumber} - ${seatNumber}]`;
    const defaultMessage = `Dear ${recipientName},\n\nYour examination seating allotment notification details are:\n- Exam: ${examName}\n- Room / Hall: ${roomNumber}\n- Seat / Desk: ${seatNumber}\n- Date & Time: ${examDate} (${timeSlot})\n\nPlease report to Room ${roomNumber} at least 15 minutes before the exam commences. Remember to bring your College Student ID card.\n\nBest regards,\nExamination Controller Cell\nExamSphere`;

    const templateParams = {
      from_name: params.from_name || 'Exam Controller Administration',
      from_email: params.from_email || 'admin@examsphere.edu',
      to_name: recipientName,
      to_email: recipientEmail,
      email: recipientEmail, // Alias
      user_email: recipientEmail, // Alias
      recipient: recipientEmail, // Alias
      student_name: recipientName,
      student_email: recipientEmail,
      exam_name: examName,
      exam: examName,
      course_code: params.course_code || 'EXAM',
      room_number: roomNumber,
      room: roomNumber,
      seat_number: seatNumber,
      seat: seatNumber,
      exam_date: examDate,
      time_slot: timeSlot,
      start_time: params.start_time || '09:30 AM',
      end_time: params.end_time || '12:30 PM',
      subject: params.subject || defaultSubject,
      message: params.message || defaultMessage
    };

    const targetTemplate = config.studentTemplateId || config.templateId;

    if (this.isConfigured()) {
      try {
        const response = await emailjs.send(
          config.serviceId,
          targetTemplate,
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
        console.error('EmailJS Student Notification Send Error:', error);
        throw new Error(error.text || error.message || 'Failed to dispatch seating notification via EmailJS.');
      }
    } else {
      console.log('[EmailJS Simulation] Student seating notification dispatched:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        mode: 'SIMULATION',
        status: 200,
        text: 'Simulation: Seating notification dispatched successfully.',
        templateParams
      };
    }
  }
};
