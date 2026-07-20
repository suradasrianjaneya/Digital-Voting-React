import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const isMailConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter = null;

if (isMailConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const sendMail = async ({ to, subject, html }) => {
  const from = process.env.SMTP_FROM || 'Digital Voting Platform <noreply@digitalvotingplatform.com>';

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return { success: true };
    } catch (error) {
      console.error('Mail sending failed, falling back to console:', error);
      logSimulatedMail(to, subject, html);
      return { success: false, error };
    }
  } else {
    logSimulatedMail(to, subject, html);
    return { success: true, simulated: true };
  }
};

function logSimulatedMail(to, subject, html) {
  console.log('\n=======================================');
  console.log('📧   SMTP MAIL SIMULATION TRIGGERED   📧');
  console.log('=======================================');
  console.log(`TO:      ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log('---------------------------------------');

  // Extract 6-digit OTP from html if exists for visibility
  const otpMatch = html.match(/<h1[^>]*>\s*(\d{6})\s*<\/h1>/) || html.match(/>(\d{6})</);
  if (otpMatch) {
    console.log(`🚨   VERIFICATION CODE / OTP: ${otpMatch[1]}   🚨`);
    console.log('---------------------------------------');
  }

  console.log(`BODY: (HTML summary)`);
  // Simple text extraction for terminal cleanliness
  const cleanBody = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  console.log(cleanBody.length > 200 ? cleanBody.substring(0, 200) + '...' : cleanBody);
  console.log('=======================================\n');
}
