import { config } from 'dotenv';

config();

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
    throw new Error('MONGO_URL is not defined');
}

export const SETTINGS = {
    MONGO_URL: mongoUrl,
    DB_NAME: process.env.DB_NAME || 'blogger_platform_nest',
};