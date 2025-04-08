const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    console.error(err.stack);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'INTERNAL_SERVER_ERROR';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
        code = 'VALIDATION_ERROR';
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = `Duplicate field value entered`;
        code = 'DUPLICATE_KEY_ERROR';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export default errorHandler; 