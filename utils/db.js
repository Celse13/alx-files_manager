const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this._db = this.client.db(database);
        console.log('MongoDB connected successfully');
      }).catch((err) => {
        console.error('MongoDB connection error:', err);
      });
  }

  get db() {
    if (!this._db) {
      throw new Error('Database connection not ready');
    }
    return this._db;
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.client.db().collection('users');
    return collection.countDocuments();
  }

  async nbFiles() {
    const collection = this.client.db().collection('files');
    return collection.countDocuments();
  }

  async getUserByToken(token) {
    const collection = this.db.collection('users');
    return collection.findOne({ token });
  }

  get filesCollection() {
    return this.db.collection('files');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
