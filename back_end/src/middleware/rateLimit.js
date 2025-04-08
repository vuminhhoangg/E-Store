import rateLimit from 'express-rate-limit';

const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 100; // limit each IP to 100 requests per windowMs

export const apiLimiter = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts, please try again later',
        code: 'LOGIN_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
}); 