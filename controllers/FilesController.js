const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

const postUpload = async (req, res) => {
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

  const fileData = {
    userId: user._id,
    name,
    type,
    isPublic: isPublic || false,
    parentId: parentId || 0,
  };

  if (type === 'folder') {
    const newFile = await dbClient.filesCollection.insertOne(fileData);
    return res.status(201).json(newFile.ops[0]);
  }
  const path = process.env.FOLDER_PATH || '/tmp/files_manager';
  const localPath = `${path}/${uuidv4()}`;
  fs.writeFileSync(localPath, data, 'base64');
  fileData.localPath = localPath;
  const newFile = await dbClient.filesCollection.insertOne(fileData);
  return res.status(201).json(newFile.ops[0]);
};

module.exports = {
  postUpload,
};
