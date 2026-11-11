const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    if (err.name === 'ZodError') {
        const errors = err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message
        }));

        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    if (err.code === '23505') {
        return res.status(409).json({
            success: false,
            message: 'A record with this value already exists'
        });
    }


    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });

};

export default errorMiddleware;