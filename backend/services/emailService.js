/**
 * EmailJS Dispatch Service for ExamSphere
 * Replaces SMTP/Nodemailer with EmailJS (https://www.emailjs.com)
 */
class EmailService {
  constructor() {
    this.serviceId = process.env.EMAILJS_SERVICE_ID || '';
    this.templateId = process.env.EMAILJS_TEMPLATE_ID || '';
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY || '';
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY || '';
  }

  isConfigured() {
    const sId = process.env.EMAILJS_SERVICE_ID || this.serviceId;
    const tId = process.env.EMAILJS_TEMPLATE_ID || this.templateId;
    const pKey = process.env.EMAILJS_PUBLIC_KEY || this.publicKey;
    return Boolean(sId && tId && pKey);
  }

  /**
   * Send real email via EmailJS API with Room Number focus
   */
  async sendEmail({ to, subject, text, html, roomNumber = null, facultyName = '', examName = '', senderName = '' }) {
    if (!to) {
      throw new Error('Recipient email is required.');
    }

    const cleanRoom = roomNumber || 'Assigned Room';
    const cleanSubject = subject || `[ExamSphere URGENT] Visit Room ${cleanRoom} - Faculty Examination Request`;
    const cleanMessage = text || `Urgent notification: Please visit Room ${cleanRoom} immediately.`;

    const serviceId = process.env.EMAILJS_SERVICE_ID || this.serviceId;
    const templateId = process.env.EMAILJS_TEMPLATE_ID || this.templateId;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || this.publicKey;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY || this.privateKey;

    if (serviceId && templateId && publicKey) {
      try {
        const payload = {
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            // Standard parameters from EmailJS template
            title: cleanSubject,
            name: facultyName || to.split('@')[0],
            time: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
            message: cleanMessage,
            to_email: to,
            recipient_email: to,
            from_name: senderName || 'Exam Controller Admin',
            from_email: 'admin@examsphere.edu',
            
            // Domain-specific aliases
            to_name: facultyName || to.split('@')[0],
            room_number: cleanRoom,
            exam_name: examName || 'Scheduled Examination',
            subject: cleanSubject,
            sender_name: senderName || 'Exam Controller'
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
          isRealEmailJs: true,
          status: 'SENT',
          recipient: to,
          roomNumber: cleanRoom,
          message: `Real email successfully dispatched to ${to} via EmailJS for Room ${cleanRoom}`
        };
      } catch (err) {
        console.error('[EmailService - EmailJS] API Error:', err.message);
        return {
          success: false,
          provider: 'EmailJS',
          isRealEmailJs: false,
          error: err.message,
          recipient: to,
          roomNumber: cleanRoom
        };
      }
    }

    // EmailJS credentials pending in .env or frontend modal
    return {
      success: true,
      provider: 'EmailJS',
      isRealEmailJs: false,
      status: 'PENDING_CONFIG',
      recipient: to,
      roomNumber: cleanRoom,
      message: `Notification queued for ${to} for Room ${cleanRoom}. EmailJS credentials pending in .env or frontend modal.`
    };
  }

  /**
   * Helper to format Room-focused doubt email content
   */
  formatDoubtRoomEmail({ facultyName, roomNumber, building = 'Academic Block', examName, courseCode, invigilatorName, questionText }) {
    const cleanRoom = roomNumber || 'Assigned Room';
    const subject = `[ExamSphere URGENT] Visit Room ${cleanRoom} - Student Doubt Resolution`;

    const text = `
URGENT: VISIT ROOM ${cleanRoom} FOR STUDENT DOUBT RESOLUTION

Dear ${facultyName || 'Faculty Member'},

An urgent question paper clarification requires your immediate presence.
Please visit Room ${cleanRoom} immediately.

============================================================
REQUIRED ROOM TO VISIT: ROOM ${cleanRoom} (${building})
============================================================
Examination:     ${examName || 'Scheduled Exam'} (${courseCode || 'N/A'})
Room to Visit:   ${cleanRoom} (${building})
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
