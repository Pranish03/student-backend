export const validate = () => {
  return (req, res, next) => {
    try {
      next();
    } catch (error) {
      console.log(error);
    }
  };
};
