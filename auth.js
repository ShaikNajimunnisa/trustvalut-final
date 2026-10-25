import jwt from 'jsonwebtoken';
const SECRET = process.env.JWT_SECRET || 'trustvault_secret_CHANGE_IN_PROD';

export function authRequired(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload; // {id, email, role}
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function roleRequired(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '1h' }
  );
}
