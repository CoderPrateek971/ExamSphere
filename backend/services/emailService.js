const EMAILJS_CONFIG = require('../config/emailjsConfig');

/**
 * Multi-Channel EmailJS Dispatch Service for ExamSphere
 * Dedicated Service IDs & Templates for:
 * 1. FACULTY: Duty assignments, roster alerts, teacher room requests
 * 2. STUDENTS: Seating allotment, hall tickets, seat coordinates
 * 3. DOUBT_SUPPORT: Real-time exam-hall question paper clarification calls
 */
class EmailService {
  constructor() {
    this.config = EMAILJS_CONFIG;
  }

  /**
   * Resolve credentials for the target channel
   * @param {'FACULTY'|'STUDENTS'|'DOUBT_SUPPORT'|string} channel 
   */
  resolveChannelConfig(channel = 'FACULTY') {
    return this.config.getCredentials(channel);
  }

  isConfigured(channel = 'FACULTY') {
    const creds = this.resolveChannelConfig(channel);
    return Boolean(creds.SERVICE_ID && creds.TEMPLATE_ID && creds.PUBLIC_KEY);
  }

  /**
   * Send real email via EmailJS API using channel-specific service and template
   */
  async sendEmail({
    to,
    subject,
    text,
    html,
    roomNumber = null,
    seatNumber = null,
    facultyName = '',
    studentName = '',
    examName = '',
    courseCode = '',
    senderName = '',
    channel = 'FACULTY', // 'FACULTY' | 'STUDENTS' | 'DOUBT_SUPPORT'
    extraParams = {}
  }) {
    if (!to) {
      throw new Error('Recipient email is required.');
    }

    const channelCreds = this.resolveChannelConfig(channel);
    const serviceId = channelCreds.SERVICE_ID;
    const templateId = channelCreds.TEMPLATE_ID;
    const publicKey = channelCreds.PUBLIC_KEY || this.config.PUBLIC_KEY;
    const privateKey = this.config.PRIVATE_KEY;

    const cleanRoom = roomNumber || 'Assigned Room';
    const cleanSeat = seatNumber || 'Assigned Desk';
    const cleanSubject = subject || (channel === 'DOUBT_SUPPORT'
      ? `[ExamSphere URGENT] Visit Room ${cleanRoom} - Faculty Doubt Request`
      : channel === 'STUDENTS'
      ? `Exam Seating Allotment: ${examName || 'Examination'} [Room ${cleanRoom}]`
      : `[ExamSphere] Examination Notification: Room ${cleanRoom}`);

    const recipientName = facultyName || studentName || to.split('@')[0];
    const cleanMessage = text || `Notification regarding Room ${cleanRoom}.`;
    const currentTime = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    if (serviceId && templateId && publicKey) {
      try {
        const payload = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            // Standard universal EmailJS template parameters
            title: cleanSubject,
            subject: cleanSubject,
            name: recipientName,
            time: currentTime,
            date: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
            message: cleanMessage,
            to_email: to,
            to_name: recipientName,
            recipient_email: to,
            email: to,
            user_email: to,
            from_name: senderName || 'Exam Controller Administration',
            from_email: 'admin@examsphere.edu',
            sender_name: senderName || 'Exam Controller Cell',

            // Domain-specific fields
            room_number: cleanRoom,
            room: cleanRoom,
            seat_number: cleanSeat,
            seat: cleanSeat,
            desk_number: cleanSeat,
            exam_name: examName || 'Scheduled Examination',
            exam: examName || 'Scheduled Examination',
            course_code: courseCode || 'EXAM',
            faculty_name: facultyName || recipientName,
            student_name: studentName || recipientName,
            channel: channel,

            // Spread any custom template variables
            ...extraParams
          }
        };

        if (privateKey) {
          payload.accessToken = privateKey;
        }

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`EmailJS API error (${response.status}): ${errText}`);
        }

        return {
          success: true,
          provider: 'EmailJS',
          channel,
          serviceId,
          templateId,
          isRealEmailJs: true,
          status: 'SENT',
          recipient: to,
          roomNumber: cleanRoom,
          message: `Real email successfully dispatched to ${to} via EmailJS [${channel}] (Service: ${serviceId}, Template: ${templateId})`
        };
      } catch (err) {
        console.error(`[EmailService - EmailJS ${channel}] API Error:`, err.message);
        return {
          success: false,
          provider: 'EmailJS',
          channel,
          isRealEmailJs: false,
          error: err.message,
          recipient: to,
          roomNumber: cleanRoom
        };
      }
    }

    return {
      success: true,
      provider: 'EmailJS',
      channel,
      isRealEmailJs: false,
      status: 'PENDING_CONFIG',
      recipient: to,
      roomNumber: cleanRoom,
      message: `Notification formatted for ${to} [${channel}]. EmailJS keys pending.`
    };
  }

  /**
   * Helper to format Room-focused doubt email content
   */
  formatDoubtRoomEmail({ facultyName, roomNumber, building = 'Academic Block', examName, courseCode, invigilatorName, questionText, studentName = null, studentRoll = null }) {
    const cleanRoom = roomNumber || 'Assigned Room';
    const subject = `[ExamSphere URGENT] Visit Room ${cleanRoom} - Question Paper Doubt Resolution`;

    const isGeneral = !studentName || studentName === 'General Room Question' || studentRoll === 'GENERAL';
    const candidateInfo = isGeneral 
      ? 'General Classroom / Whole Exam Hall (Paper Ambiguity)' 
      : `${studentName} (${studentRoll || 'Candidate'})`;

    const text = `
URGENT: VISIT ROOM ${cleanRoom} FOR EXAMINATION DOUBT RESOLUTION

Dear ${facultyName || 'Faculty Member'},

An urgent question paper clarification requires your immediate presence.
Please visit Room ${cleanRoom} immediately.

============================================================
REQUIRED ROOM TO VISIT: ROOM ${cleanRoom} (${building})
============================================================
Examination:     ${examName || 'Scheduled Exam'} (${courseCode || 'N/A'})
Room to Visit:   ${cleanRoom} (${building})
Scope / Student: ${candidateInfo}
Invigilator:     ${invigilatorName || 'Room Invigilator'}
Doubt / Query:   "${questionText || 'Student clarification required'}"

Action Required: Please proceed directly to Room ${cleanRoom}.
============================================================
ExamSphere Automated Examination Controller (EmailJS Integration)
    `.trim();

    return { subject, text, html: text };
  }
}

module.exports = new EmailService();
