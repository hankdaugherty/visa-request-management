const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const emailTemplates = {
  applicationSubmitted: (applicantName) => ({
    subject: 'Visa Application Received',
    text: `Dear ${applicantName},\n\nYour visa application has been successfully submitted. Our team will review your application and update you on any progress.\n\nBest regards,\nEvent Organization Team`
  }),
  
  adminNotification: (applicantName) => ({
    subject: 'New Visa Application Received',
    text: `A new visa application has been submitted by ${applicantName}. Please log in to the admin dashboard to review the application.`
  }),
  
  applicationStatusUpdate: (applicantName, status) => ({
    subject: 'Visa Application Status Update',
    text: `Dear ${applicantName},\n\nYour visa application status has been updated to: ${status}.\n\nBest regards,\nEvent Organization Team`
  })
};

exports.sendEmail = async (to, templateName, data) => {
  try {
    const template = emailTemplates[templateName](data);
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: template.subject,
      text: template.text
    });
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

exports.notifyAdmins = async (templateName, data) => {
  try {
    const User = require('../models/User');
    const adminEmails = await User.find({ role: 'admin' })
      .select('email')
      .map(admin => admin.email);
    
    return await Promise.all(
      adminEmails.map(email => 
        exports.sendEmail(email, templateName, data)
      )
    );
  } catch (error) {
    console.error('Admin notification error:', error);
    return false;
  }
}; 