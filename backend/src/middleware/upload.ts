import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { ApiError } from '../utils/apiError';

// Ensure upload directories exist
const uploadDirs = {
  products: 'uploads/products',
  avatars: 'uploads/avatars',
  tests: 'uploads/tests',
  documents: 'uploads/documents',
};

// Create upload directories if they don't exist
Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  avatar: 2 * 1024 * 1024, // 2MB
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    let uploadPath = uploadDirs.products; // default

    // Determine upload path based on field name or route
    if (file.fieldname === 'avatar') {
      uploadPath = uploadDirs.avatars;
    } else if (file.fieldname === 'testImages' || req.path.includes('/test')) {
      uploadPath = uploadDirs.tests;
    } else if (file.fieldname === 'documents') {
      uploadPath = uploadDirs.documents;
    } else if (file.fieldname === 'images' || file.fieldname === 'productImages') {
      uploadPath = uploadDirs.products;
    }

    cb(null, uploadPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
  try {
    let isValid = false;
    let errorMessage = 'Invalid file type';

    // Check file type based on field name
    if (file.fieldname === 'avatar' || file.fieldname === 'images' || file.fieldname === 'productImages' || file.fieldname === 'testImages') {
      isValid = allowedImageTypes.includes(file.mimetype);
      errorMessage = 'Only JPEG, PNG, and WebP images are allowed';
    } else if (file.fieldname === 'documents') {
      isValid = allowedDocumentTypes.includes(file.mimetype);
      errorMessage = 'Only PDF and Word documents are allowed';
    } else {
      // Default to image validation
      isValid = allowedImageTypes.includes(file.mimetype);
      errorMessage = 'Only JPEG, PNG, and WebP images are allowed';
    }

    if (isValid) {
      cb(null, true);
    } else {
      cb(new ApiError(400, errorMessage), false);
    }
  } catch (error) {
    cb(new ApiError(500, 'File validation failed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image, // Default limit, will be overridden per route
    files: 10, // Maximum 10 files at once
  },
});

// Custom middleware for different file types
export const uploadProductImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 5, // Maximum 5 product images
  },
}).array('images', 5);

export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.avatar,
    files: 1,
  },
}).single('avatar');

export const uploadTestImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.image,
    files: 10, // Maximum 10 test images
  },
}).array('testImages', 10);

export const uploadDocuments = multer({
  storage: storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: Function) => {
    const isValid = allowedDocumentTypes.includes(file.mimetype);
    if (isValid) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only PDF and Word documents are allowed'), false);
    }
  },
  limits: {
    fileSize: FILE_SIZE_LIMITS.document,
    files: 5,
  },
}).array('documents', 5);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: any, next: Function) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large. Maximum allowed size is 5MB for images and 10MB for documents';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum allowed files exceeded';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = error.message || 'File upload error';
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: error.code,
        statusCode,
      },
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    });
  }

  next(error);
};

// Cleanup uploaded files on error
export const cleanupUploadedFiles = (req: Request) => {
  const files = (req as any).files || [(req as any).file].filter(Boolean);
  
  if (files && files.length > 0) {
    files.forEach((file: Express.Multer.File) => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err) {
            console.error('Failed to cleanup uploaded file:', err);
          }
        });
      }
    });
  }
};

// File validation utilities
export const validateImageFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!allowedImageTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' };
  }

  if (file.size > FILE_SIZE_LIMITS.image) {
    return { isValid: false, error: 'File too large. Maximum size is 5MB' };
  }

  return { isValid: true };
};

export const validateDocumentFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!allowedDocumentTypes.includes(file.mimetype)) {
    return { isValid: false, error: 'Invalid file type. Only PDF and Word documents are allowed' };
  }

  if (file.size > FILE_SIZE_LIMITS.document) {
    return { isValid: false, error: 'File too large. Maximum size is 10MB' };
  }

  return { isValid: true };
};

// Generate file URL
export const generateFileUrl = (req: Request, filePath: string): string => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/${filePath}`;
};

// File compression middleware (for future enhancement)
export const compressImages = async (req: Request, res: any, next: Function) => {
  // Placeholder for image compression logic
  // Could use libraries like sharp or imagemin
  next();
};

// Cloud storage upload (AWS S3, Google Cloud, etc.)
export const uploadToCloud = async (file: Express.Multer.File): Promise<string> => {
  try {
    // Placeholder for cloud storage upload
    // This would integrate with AWS S3, Google Cloud Storage, etc.
    
    if (process.env.NODE_ENV === 'production' && process.env.AWS_S3_BUCKET) {
      // AWS S3 upload logic would go here
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
      });

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/${Date.now()}-${file.originalname}`,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await s3.upload(uploadParams).promise();
      
      // Clean up local file after upload
      fs.unlinkSync(file.path);
      
      return result.Location;
    }

    // Return local file path for development
    return file.path;
  } catch (error) {
    console.error('Cloud upload failed:', error);
    throw new ApiError(500, 'Failed to upload file to cloud storage');
  }
};

// Middleware to process uploaded files
export const processUploadedFiles = async (req: Request, res: any, next: Function) => {
  try {
    const files = (req as any).files || [(req as any).file].filter(Boolean);
    
    if (files && files.length > 0) {
      // Process each file (compression, cloud upload, etc.)
      const processedFiles = await Promise.all(
        files.map(async (file: Express.Multer.File) => {
          // Upload to cloud if configured
          if (process.env.UPLOAD_TO_CLOUD === 'true') {
            file.cloudUrl = await uploadToCloud(file);
          }
          
          // Generate public URL
          file.publicUrl = generateFileUrl(req, file.path);
          
          return file;
        })
      );

      // Update request with processed files
      if ((req as any).files) {
        (req as any).files = processedFiles;
      } else {
        (req as any).file = processedFiles[0];
      }
    }

    next();
  } catch (error) {
    // Clean up uploaded files on error
    cleanupUploadedFiles(req);
    next(error);
  }
};

// Export default upload instance
export { upload };

// Export file type constants
export const FILE_TYPES = {
  IMAGE: allowedImageTypes,
  DOCUMENT: allowedDocumentTypes,
};

export const UPLOAD_PATHS = uploadDirs;