import { config } from 'dotenv';

config();

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
   throw new Error('MONGO_URL is not defined');
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;

if (!jwtAccessSecret) {
   throw new Error('JWT_ACCESS_SECRET is not defined');
}

const smtpHost = process.env.SMTP_HOST;

if (!smtpHost) {
   throw new Error('SMTP_HOST is not defined');
}

const smtpPort = Number(process.env.SMTP_PORT);

if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
   throw new Error('SMTP_PORT must be a valid port number');
}

const smtpUser = process.env.SMTP_USER;

if (!smtpUser) {
   throw new Error('SMTP_USER is not defined');
}

const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpPassword) {
   throw new Error('SMTP_PASSWORD is not defined');
}

const smtpFrom = process.env.SMTP_FROM || smtpUser;

export const SETTINGS = {
   MONGO_URL: mongoUrl,
   DB_NAME: process.env.DB_NAME || 'blogger_platform_nest',

   JWT_ACCESS_SECRET: jwtAccessSecret,

   SMTP: {
      HOST: smtpHost,
      PORT: smtpPort,
      SECURE: process.env.SMTP_SECURE === 'true',
      USER: smtpUser,
      PASSWORD: smtpPassword,
      FROM: smtpFrom,
   },
};
