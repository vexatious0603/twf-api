// utils/response.js
export const successResponse = (res, message, data = null, code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message, code = 500) => {
  return res.status(code).json({
    success: false,
    message,
    data: null
  });
};
