import { z } from 'zod'; 

export const validate = (schema) => {

    return (req, res, next) => {

        const result = schema.safeParse(req.body);

        if (!result.success) {

            /*
            | Hand the ZodError to the error middleware so validation
            | failures use the same `{success:false, message}` envelope
            | (plus the per-field `errors` list) as every other error.
            */
            return next(result.error);

        }

        req.body = result.data;

        next();
    };
};