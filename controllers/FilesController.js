const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const user = await dbClient.getUserByToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, isPublic, data, parentId,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await dbClient.filesCollection.findOne({ _id: parentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    if (type === 'folder') {
      const newFolder = await dbClient.filesCollection.insertOne({
        name, type, userId: user._id, parentId: parentId || 0, isPublic: isPublic || false,
      });
      return res.status(201).json(newFolder.ops[0]);
    }
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const fileUuid = uuidv4();
    const localPath = path.join(folderPath, fileUuid);
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    const newFile = await dbClient.filesCollection.insertOne({
      name, type, userId: user._id, parentId: parentId || 0, isPublic: isPublic || false, localPath,
    });
    return res.status(201).json(newFile.ops[0]);
  }
}

module.exports = FilesController;
