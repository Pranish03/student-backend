export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        return res.status(422).json({
          message: "Validation error",
          error: result.error.errors,
        });
      }

      req.validated = result.data;

      next();
    } catch (error) {
      console.log(error);
    }
  };
};
