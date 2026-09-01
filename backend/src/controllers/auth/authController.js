const authService = require('../../services/auth/authService');

const register = async (req, res, next) => {
  try {
    const { email, password, fullName, fieldOfStudy, graduationYear } = req.body;
    const result = await authService.register({
      email,
      password,
      fullName,
      fieldOfStudy,
      graduationYear,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    authService.logout(refreshToken);
    res.status(200).json({ success: true, data: { message: 'Logout successful' } });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
