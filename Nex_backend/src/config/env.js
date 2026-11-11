import 'dotenv/config';

const requiredEnvVariables = [
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
];

for (const variable of requiredEnvVariables) {
    if (!process.env[variable]) {
        throw new Error(`Missing required environment variable: ${variable}`);
    }
}

export const env = {
    port: Number(process.env.PORT),

    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,

    },

    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,

    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d"
    
};