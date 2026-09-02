const superbase = require('../config/superbase');

async function uploadCV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file= req.file;

    const allowedtypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedtypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF and DOCX' });
    }
    if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
    }
    const fileName = `${Date.now()}_${file.originalname}`;

    const { data, error } = await superbase.storage
      .from('cv-files')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
      if (error) {
        console.error('Error uploading file to Supabase:', error);
        throw error;
      }
      return res.status(201).json({ message: 'File uploaded successfully', filePath: data.Key });
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }   }

    module.exports = {
      uploadCV,
    };