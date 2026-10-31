import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, FACULTY_AND_DOUBT_PUBLIC_KEY, STUDENT_PUBLIC_KEY } from '../config/emailjsConfig';

export { EMAILJS_CONFIG, FACULTY_AND_DOUBT_PUBLIC_KEY, STUDENT_PUBLIC_KEY };

/**
 * Multi-Channel EmailJS Dispatch Service (Frontend)
 * Option 1 Architecture:
 * 1. FACULTY: Service ID, Template ID, and Faculty/Doubt Public Key
 * 2. STUDENTS: Service ID, Template ID, and Dedicated Student Public Key
 * 3. DOUBT_SUPPORT: Service ID, Template ID, and Faculty/Doubt Public Key
 */
export const emailService = {
  /**
   * Get active EmailJS credentials for a given channel
   * @param {'FACULTY'|'STUDENTS'|'DOUBT_SUPPORT'|string} channel 
   */
  getConfig(channel = 'FACULTY') {
    let saved = {};
    try {
      const stored = localStorage.getItem('examsphere_emailjs_config') || localStorage.getItem('examsphere_emailjs');
      if (stored) saved = JSON.parse(stored);
    } catch {
      saved = {};
    }

    const norm = (channel || 'FACULTY').toUpperCase().replace(/[-\s]/g, '_');

    // 1. STUDENTS: Uses separate Student Public Key
    if (norm.includes('STUDENT')) {
      const studentConf = saved.students || saved.STUDENTS || {};
      const pubKey = studentConf.publicKey || saved.studentPublicKey || EMAILJS_CONFIG.STUDENTS.PUBLIC_KEY;
      return {
        channel: 'STUDENTS',
        serviceId: studentConf.serviceId || saved.studentServiceId || EMAILJS_CONFIG.STUDENTS.SERVICE_ID,
        templateId: studentConf.templateId || saved.studentTemplateId || EMAILJS_CONFIG.STUDENTS.TEMPLATE_ID,
        publicKey: pubKey
      };
    }

    // 2. DOUBT SUPPORT: Uses Faculty & Doubt Public Key
    if (norm.includes('DOUBT')) {
      const doubtConf = saved.doubtSupport || saved.DOUBT_SUPPORT || saved.doubt || {};
      const pubKey = doubtConf.publicKey || saved.facultyAndDoubtPublicKey || saved.publicKey || EMAILJS_CONFIG.DOUBT_SUPPORT.PUBLIC_KEY;
      return {
        channel: 'DOUBT_SUPPORT',
        serviceId: doubtConf.serviceId || saved.doubtServiceId || EMAILJS_CONFIG.DOUBT_SUPPORT.SERVICE_ID,
        templateId: doubtConf.templateId || saved.doubtTemplateId || EMAILJS_CONFIG.DOUBT_SUPPORT.TEMPLATE_ID,
        publicKey: pubKey
      };
    }

    // 3. FACULTY: Uses Faculty & Doubt Public Key
    const facultyConf = saved.faculty || saved.FACULTY || {};
    const pubKey = facultyConf.publicKey || saved.facultyAndDoubtPublicKey || saved.publicKey || EMAILJS_CONFIG.FACULTY.PUBLIC_KEY;
    return {
      channel: 'FACULTY',
      serviceId: facultyConf.serviceId || saved.serviceId || EMAILJS_CONFIG.FACULTY.SERVICE_ID,
      templateId: facultyConf.templateId || saved.templateId || EMAILJS_CONFIG.FACULTY.TEMPLATE_ID,
      publicKey: pubKey
    };
  },

  /**
   * Retrieve full 3-channel configuration for settings UI
   */
  getAllConfig() {
    let saved = {};
    try {
      const stored = localStorage.getItem('examsphere_emailjs_config') || localStorage.getItem('examsphere_emailjs');
      if (stored) saved = JSON.parse(stored);
    } catch {}

    const facDoubtKey = saved.facultyAndDoubtPublicKey || saved.publicKey || EMAILJS_CONFIG.FACULTY.PUBLIC_KEY || '';
    const studentKey = saved.studentPublicKey || saved.students?.publicKey || EMAILJS_CONFIG.STUDENTS.PUBLIC_KEY || '';

    return {
      facultyAndDoubtPublicKey: facDoubtKey,
      studentPublicKey: studentKey,
      faculty: {
        serviceId: saved.faculty?.serviceId || saved.serviceId || EMAILJS_CONFIG.FACULTY.SERVICE_ID || '',
        templateId: saved.faculty?.templateId || saved.templateId || EMAILJS_CONFIG.FACULTY.TEMPLATE_ID || '',
        publicKey: facDoubtKey
      },
      students: {
        serviceId: saved.students?.serviceId || saved.studentServiceId || EMAILJS_CONFIG.STUDENTS.SERVICE_ID || '',
        templateId: saved.students?.templateId || saved.studentTemplateId || EMAILJS_CONFIG.STUDENTS.TEMPLATE_ID || '',
        publicKey: studentKey
      },
      doubtSupport: {
        serviceId: saved.doubtSupport?.serviceId || saved.doubtServiceId || EMAILJS_CONFIG.DOUBT_SUPPORT.SERVICE_ID || '',
        templateId: saved.doubtSupport?.templateId || saved.doubtTemplateId || EMAILJS_CONFIG.DOUBT_SUPPORT.TEMPLATE_ID || '',
        publicKey: facDoubtKey
      }
    };
  },

  /**
   * Save complete 3-channel EmailJS configuration into localStorage
   */
  saveAllConfig(config) {
    try {
      localStorage.setItem('examsphere_emailjs_config', JSON.stringify(config));
      localStorage.setItem('examsphere_emailjs', JSON.stringify({
        facultyAndDoubtPublicKey: config.facultyAndDoubtPublicKey,
        studentPublicKey: config.studentPublicKey,
        publicKey: config.facultyAndDoubtPublicKey,
        serviceId: config.faculty?.serviceId,
        templateId: config.faculty?.templateId,
        studentServiceId: config.students?.serviceId,
        studentTemplateId: config.students?.templateId,
        doubtServiceId: config.doubtSupport?.serviceId,
        doubtTemplateId: config.doubtSupport?.templateId
      }));
      return true;
    } catch (e) {
      console.error('Failed to save EmailJS configuration:', e);
      return false;
    }
  },

  isConfigured(channel = 'FACULTY') {
    const config = this.getConfig(channel);
    return Boolean(
      config.serviceId?.trim() && 
      config.templateId?.trim() && 
      config.publicKey?.trim() &&
      !config.publicKey.includes('YOUR_') &&
      !config.publicKey.includes('here')
    );
  },

  /**
   * 1. Send automated duty assignment / faculty email using FACULTY Service & Template + Faculty Public Key
   */
  async sendDutyEmail(params) {
    const config = this.getConfig('FACULTY');
    const recipient = params.to_email || params.email;
    const recipientName = params.to_name || params.name || 'Faculty Member';
    const currentTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const templateParams = {
      from_name: params.from_name || 'Exam Controller Administration',
      from_email: params.from_email || 'admin@examsphere.edu',
      to_name: recipientName,
      to_email: recipient,
      recipient_email: recipient,
      email: recipient,
      user_email: recipient,
      title: `Exam Duty Assignment: ${params.exam_name} [${params.room_number}]`,
      subject: params.subject || `Exam Duty Assignment: ${params.exam_name} [${params.room_number}]`,
      name: recipientName,
      time: currentTime,
      date: params.exam_date || new Date().toLocaleDateString('en-US'),
      exam_name: params.exam_name,
      exam: params.exam_name,
      course_code: params.course_code || 'EXAM',
      room_number: params.room_number,
      room: params.room_number,
      exam_date: params.exam_date,
      time_slot: `${params.start_time || '09:30 AM'} - ${params.end_time || '12:30 PM'}`,
      start_time: params.start_time || '09:30 AM',
      end_time: params.end_time || '12:30 PM',
      message: params.message || `Dear ${recipientName},\n\nYou have been assigned as Invigilator for ${params.exam_name} in Room ${params.room_number} on ${params.exam_date} (${params.start_time} - ${params.end_time}).\n\nPlease report to the examination hall 20 minutes prior to the start time.\n\nRegards,\nExam Controller Administration\nExamSphere`
    };

    if (this.isConfigured('FACULTY')) {
      try {
        const response = await emailjs.send(
          config.serviceId.trim(),
          config.templateId.trim(),
          templateParams,
          config.publicKey.trim()
        );
        return {
          success: true,
          mode: 'LIVE_EMAILJS',
          channel: 'FACULTY',
          status: response.status,
          text: response.text,
          templateParams
        };
      } catch (error) {
        console.error('EmailJS [FACULTY] Send Error:', error);
        throw new Error(error.text || error.message || 'Failed to dispatch faculty email via EmailJS.');
      }
    } else {
      console.log('[EmailJS Simulation - FACULTY] Dispatched:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        mode: 'SIMULATION',
        channel: 'FACULTY',
        status: 200,
        text: 'Simulation: Faculty email formatted & ready. Configure EmailJS keys to deliver to real inboxes.',
        templateParams
      };
    }
  },

  /**
   * 2. Send automated student seating allotment email using STUDENTS Service & Template + Separate Student Public Key
   */
  async sendStudentSeatingEmail(params) {
    const config = this.getConfig('STUDENTS');

    const recipientEmail = params.student_email || params.to_email || params.email;
    const recipientName = params.student_name || params.to_name || 'Student';
    const examName = params.exam_name || params.exam || 'Upcoming Examination';
    const roomNumber = params.room_number || params.room || 'TBD';
    const seatNumber = params.seat_number || params.seat || 'TBD';
    const examDate = params.exam_date || new Date().toLocaleDateString('en-US');
    const timeSlot = params.time_slot || (params.start_time && params.end_time ? `${params.start_time} - ${params.end_time}` : 'Scheduled Time Slot');
    const currentTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const defaultSubject = `Exam Seating Allotment: ${examName} [Room ${roomNumber} - Seat ${seatNumber}]`;
    const defaultMessage = `Dear ${recipientName},\n\nYour examination seating allotment notification details are:\n- Examination: ${examName}\n- Room / Hall: ${roomNumber}\n- Assigned Seat: ${seatNumber}\n- Date & Time: ${examDate} (${timeSlot})\n\nPlease report to Room ${roomNumber} at least 15 minutes before the exam commences. Remember to bring your College Student ID card.\n\nBest regards,\nExamination Controller Cell\nExamSphere`;

    const templateParams = {
      from_name: params.from_name || 'Exam Controller Administration',
      from_email: params.from_email || 'admin@examsphere.edu',
      to_name: recipientName,
      to_email: recipientEmail,
      email: recipientEmail,
      user_email: recipientEmail,
      recipient: recipientEmail,
      recipient_email: recipientEmail,
      student_name: recipientName,
      student_email: recipientEmail,
      name: recipientName,
      title: params.subject || defaultSubject,
      subject: params.subject || defaultSubject,
      time: currentTime,
      date: examDate,
      exam_name: examName,
      exam: examName,
      course_code: params.course_code || 'EXAM',
      room_number: roomNumber,
      room: roomNumber,
      seat_number: seatNumber,
      seat: seatNumber,
      desk_number: seatNumber,
      exam_date: examDate,
      time_slot: timeSlot,
      start_time: params.start_time || '09:30 AM',
      end_time: params.end_time || '12:30 PM',
      message: params.message || defaultMessage
    };

    if (this.isConfigured('STUDENTS')) {
      try {
        const response = await emailjs.send(
          config.serviceId.trim(),
          config.templateId.trim(),
          templateParams,
          config.publicKey.trim()
        );
        return {
          success: true,
          mode: 'LIVE_EMAILJS',
          channel: 'STUDENTS',
          status: response.status,
          text: response.text,
          templateParams
        };
      } catch (error) {
        console.error('EmailJS [STUDENTS] Send Error:', error);
        throw new Error(error.text || error.message || 'Failed to dispatch student seating notification via EmailJS.');
      }
    } else {
      console.log('[EmailJS Simulation - STUDENTS] Dispatched:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        mode: 'SIMULATION',
        channel: 'STUDENTS',
        status: 200,
        text: 'Simulation: Student seating notification formatted & ready.',
        templateParams
      };
    }
  },

  /**
   * 3. Send real-time doubt clarification / hall alert using DOUBT_SUPPORT Service & Template + Faculty/Doubt Public Key
   */
  async sendDoubtNotification(params) {
    const config = this.getConfig('DOUBT_SUPPORT');

    const recipient = params.recipientEmail || params.to_email || params.email;
    const facultyName = params.facultyName || params.to_name || 'Faculty Member';
    const roomNumber = params.roomNumber || params.room_number || 'Exam Hall';
    const examName = params.examName || params.exam_name || 'Ongoing Examination';
    const invigilatorName = params.invigilatorName || params.from_name || 'Hall Invigilator';
    const questionText = params.questionText || params.question || params.message || 'Student clarification required';
    const currentTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const emailSubject = params.subject || `[ExamSphere URGENT] Question Paper Doubt in Room ${roomNumber}`;
    const emailBody = params.message || `Urgent Student Doubt: "${questionText}"\n\nExam: ${examName}\nInvigilator: ${invigilatorName}\nRequired Location: Please visit Room ${roomNumber} immediately to address this question.`;

    const templateParams = {
      from_name: invigilatorName,
      from_email: params.from_email || 'invigilator@examsphere.edu',
      to_name: facultyName,
      to_email: recipient,
      recipient_email: recipient,
      email: recipient,
      user_email: recipient,
      name: facultyName,
      title: emailSubject,
      subject: emailSubject,
      time: currentTime,
      date: new Date().toLocaleDateString('en-US'),
      message: emailBody,
      doubt_text: questionText,
      question_text: questionText,
      room_number: roomNumber,
      room: roomNumber,
      exam_name: examName,
      exam: examName,
      course_code: params.courseCode || 'EXAM',
      invigilator_name: invigilatorName,
      urgency: 'HIGH'
    };

    if (this.isConfigured('DOUBT_SUPPORT')) {
      try {
        const response = await emailjs.send(
          config.serviceId.trim(),
          config.templateId.trim(),
          templateParams,
          config.publicKey.trim()
        );
        return {
          success: true,
          mode: 'LIVE_EMAILJS',
          channel: 'DOUBT_SUPPORT',
          status: response.status,
          text: response.text,
          templateParams
        };
      } catch (error) {
        console.error('EmailJS [DOUBT_SUPPORT] Send Error:', error);
        throw new Error(error.text || error.message || 'Failed to dispatch doubt support alert via EmailJS.');
      }
    } else {
      console.log('[EmailJS Simulation - DOUBT_SUPPORT] Dispatched:', templateParams);
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        success: true,
        mode: 'SIMULATION',
        channel: 'DOUBT_SUPPORT',
        status: 200,
        text: 'Simulation: Doubt alert dispatched to faculty in simulation mode.',
        templateParams
      };
    }
  }
};
