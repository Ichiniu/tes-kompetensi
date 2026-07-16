const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('Format file tidak didukung. Gunakan PNG/JPG/JPEG.'));
    }
    const mime = file.mimetype;
    if (mime !== 'image/png' && mime !== 'image/jpeg') {
      return cb(new Error('MIME tipe tidak valid.'));
    }
    cb(null, true);
  }
});

const magicByteValidator = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const buffer = Buffer.alloc(4);
  const fd = fs.openSync(req.file.path, 'r');
  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  const hex = buffer.toString('hex').toUpperCase();
  const isJPEG = hex.startsWith('FFD8FF');
  const isPNG = hex === '89504E47';

  if (!isJPEG && !isPNG) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'File rusak atau ekstensi dipalsukan (Magic bytes tidak cocok).' });
  }

  next();
};

module.exports = {
  uploadPegawaiFoto: upload.single('foto'),
  magicByteValidator
};
