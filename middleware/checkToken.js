const redisClient = require('../functions/redis');

const checkAuth = async (req, res, next) => {

  try {
    let token = req.query.token;

    if (!token) {
      const authHeader = req.headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Authorization header missing');
        return res.status(401).json({ message: 'Authorization header with Bearer token or token in URL required' });
      }

      token = authHeader.split(' ')[1];

      if (!token) {
        console.log('Bearer token missing');
        return res.status(401).json({ message: 'Bearer token required' });
      }
    }

    // Check if the token exists in Redis
    const userData = await redisClient.hgetall(token);

    if (!userData || Object.keys(userData).length === 0) {
      console.log('Token not found or invalid:', token);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // If token and user data are valid, attach user data to the request and proceed
    req.user = userData;
    req.token = token;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }

}

module.exports = checkAuth;
