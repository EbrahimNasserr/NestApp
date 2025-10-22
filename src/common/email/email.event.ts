import { OtpTypeEnum } from '../enums';
import { sendEmail } from './email.service';

import EventEmitter from 'events';

interface EmailEventData {
  email: string;
  error: string;
}

export const emailEvent = new EventEmitter();

emailEvent.on(
  OtpTypeEnum.CONFIRM_EMAIL,
  (email: string, otp: string, fullName: string) => {
    void (async () => {
      try {
        await sendEmail({
          to: email,
          subject: 'Confirm Email OTP',
          text: `Your OTP is ${otp}`,
          html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f4f4f7;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.email-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.email-header {
  background-color: #2f80ed;
  color: #ffffff;
  text-align: center;
  padding: 20px 0;
  font-size: 24px;
  font-weight: bold;
}
.email-body {
  padding: 30px;
  color: #333333;
}
.email-body h1 {
  font-size: 20px;
  margin-bottom: 10px;
}
.email-body p {
  font-size: 16px;
  line-height: 1.6;
}
.email-footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #888888;
}
.button {
  display: inline-block;
  margin-top: 20px;
  background-color: #2f80ed;
  color: white;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 5px;
  font-weight: bold;
}
@media screen and (max-width: 600px) {
  .email-body {
    padding: 20px;
  }
}
</style>
</head>
<body>
<div class="email-container">
<div class="email-header">
  NestjsApp
</div>
<div class="email-body">
  <h1>Hello ${fullName},</h1>
  <p>
    Thank you for connecting with us. We're excited to have you on board.
    This is a confirmation that your action has been successfully completed.
  </p>
  <p>
    Your OTP is ${otp}
  </p>
</div>
<div class="email-footer">
  © ${new Date().getFullYear()} NestjsApp. All rights reserved.<br>
</div>
</div>
</body>
</html>`,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        // Optionally emit an error event
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        emailEvent.emit('emailError', {
          email,
          error: errorMessage,
        } as EmailEventData);
      }
    })();
  },
);

// Generic email event for custom emails
emailEvent.on(
  'sendCustomEmail',
  (emailData: { to: string; subject: string; text: string; html: string }) => {
    void (async () => {
      try {
        await sendEmail(emailData);
      } catch (error) {
        console.error('Failed to send custom email:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        emailEvent.emit('emailError', {
          email: emailData.to,
          error: errorMessage,
        } as EmailEventData);
      }
    })();
  },
);

// Reset password email event
emailEvent.on(
  OtpTypeEnum.RESET_PASSWORD,
  (email: string, resetToken: string, fullName: string) => {
    void (async () => {
      try {
        await sendEmail({
          to: email,
          subject: 'Reset Password OTP',
          text: `Your reset password OTP is ${resetToken}`,
          html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f4f4f7;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.email-container {
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.email-header {
  background-color: #e74c3c;
  color: #ffffff;
  text-align: center;
  padding: 20px 0;
  font-size: 24px;
  font-weight: bold;
}
.email-body {
  padding: 30px;
  color: #333333;
}
.email-body h1 {
  font-size: 20px;
  margin-bottom: 10px;
}
.email-body p {
  font-size: 16px;
  line-height: 1.6;
}
.email-footer {
  text-align: center;
  padding: 20px;
  font-size: 14px;
  color: #888888;
}
@media screen and (max-width: 600px) {
  .email-body {
    padding: 20px;
  }
}
</style>
</head>
<body>
<div class="email-container">
<div class="email-header">
  Password Reset - NestjsApp
</div>
<div class="email-body">
  <h1>Hello ${fullName || 'User'},</h1>
  <p>
    You have requested to reset your password. Please use the OTP below to reset your password.
  </p>
  <p>
    <strong>Your Reset Password OTP: ${resetToken}</strong>
  </p>
  <p>
    This OTP will expire in 2 minutes. If you did not request this, please ignore this email.
  </p>
</div>
<div class="email-footer">
  © ${new Date().getFullYear()} NestjsApp. All rights reserved.<br>
</div>
</div>
</body>
</html>`,
        });
      } catch (error) {
        console.error('Failed to send reset password email:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        emailEvent.emit('emailError', {
          email,
          error: errorMessage,
        } as EmailEventData);
      }
    })();
  },
);
