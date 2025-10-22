import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create transporter lazily to ensure env vars are loaded
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    if (
      !process.env.MAIL_HOST ||
      !process.env.MAIL_PORT ||
      !process.env.MAIL_USER ||
      !process.env.MAIL_PASS
    ) {
      throw new Error(
        'Email configuration is missing. Please set MAIL_HOST, MAIL_PORT, MAIL_USER, and MAIL_PASS environment variables.',
      );
    }

    const port = Number(process.env.MAIL_PORT);

    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: port,
      secure: port === 465, // true for 465 (SSL), false for other ports like 587 (TLS)
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        // Don't fail on invalid certs for development
        rejectUnauthorized: false,
      },
    });
  }
  return transporter;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: EmailOptions): Promise<void> => {
  try {
    const emailTransporter = getTransporter();
    await emailTransporter.sendMail({
      from: `"NestJS App" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};
