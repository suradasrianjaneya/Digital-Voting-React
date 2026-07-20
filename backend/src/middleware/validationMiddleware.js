export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails,
    });
  }
};
