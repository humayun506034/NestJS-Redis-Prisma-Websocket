import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export async function sendVerificationEmail(
  ConfigService: ConfigService,
  to: string,
  subject: string,
  html: string, // এখন parameter HTML
) {
  const smtpUser = ConfigService.get<string>('SMTP_USER');
  // const smtpUser = process.env.SMTP_USER;
  const smtpPass = ConfigService.get<string>('SMTP_PASS'); // const smtpPass = process.env.SMTP_PASS;
  const smtpHost = ConfigService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
  const smtpPort = Number(ConfigService.get<string>('SMTP_PORT') ?? 587);
  const smtpFrom = ConfigService.get<string>('SMTP_FROM') ?? smtpUser;

  if (!smtpUser || !smtpPass || !smtpFrom || Number.isNaN(smtpPort)) {
    return {
      success: false,
      skipped: true,
      error: 'SMTP configuration missing',
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: smtpFrom,
    to,
    subject,
    html, // এখানে text নয়, html ব্যবহার হবে
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, info };
  } catch (error: unknown) {
    console.error('Email error:', error);
    const message = error instanceof Error ? error.message : 'Email error';
    return { success: false, error: message };
  }
}

// import * as nodemailer from 'nodemailer';
// import { ConfigService } from '@nestjs/config';

// export async function sendVerificationEmail(
//   configService: ConfigService,
//   to: string,
//   subject: string,
//   html: string,
// ) {
//   const smtpUser = configService.get<string>('SMTP_USER');
//   const smtpPass = configService.get<string>('SMTP_PASS');
//   const smtpHost =
//     configService.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
//   const smtpPort =
//     Number(configService.get<number>('SMTP_PORT')) || 587;
//   const smtpFrom =
//     configService.get<string>('SMTP_FROM') ?? smtpUser;

//   if (!smtpUser || !smtpPass || !smtpFrom) {
//     throw new Error('SMTP configuration missing');
//   }

//   const transporter = nodemailer.createTransport({
//     host: smtpHost,
//     port: smtpPort,
//     secure: false,
//     auth: {
//       user: smtpUser,
//       pass: smtpPass,
//     },
//   });

//   const mailOptions = {
//     from: smtpFrom,
//     to,
//     subject,
//     html,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent:', info.response);
//     return { success: true, info };
//   } catch (error: unknown) {
//     console.error('Email error:', error);
//     const message = error instanceof Error ? error.message : 'Email error';
//     return { success: false, error: message };
//   }
// }
