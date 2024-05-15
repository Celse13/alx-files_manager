// AuthController.js
const { v4: uuidv4 } = require('uuid');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    const [email, password] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 'EX', 24 * 60 * 60);
    res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    res.status(204).end();
  }
}
