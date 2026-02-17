import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { ApiError } from '../utils/apiError';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';

const createProductSchema = z.object({
  body: z.object({
    nameEn: z.string().min(1, 'Product name (English) is required'),
    nameHi: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    expectedPrice: z.number().positive('Expected price must be positive'),
    descriptionEn: z.string().optional(),
    descriptionHi: z.string().optional(),
    harvestDate: z.string().optional(),
    expiryDate: z.string().optional(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    nameEn: z.string().min(1).optional(),
    nameHi: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().min(1).optional(),
    expectedPrice: z.number().positive().optional(),
    descriptionEn: z.string().optional(),
    descriptionHi: z.string().optional(),
    harvestDate: z.string().optional(),
    expiryDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'UNDER_BID', 'SOLD', 'CANCELLED']).optional(),
  }),
});

export class ProductController {
  // Create product (Farmer only)
  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(createProductSchema, req);
      
      const farmerId = (req as any).user.id;
      const productData = { ...req.body, farmerId };
      
      // Handle image uploads if present
      const images = (req as any).files?.map((file: any) => file.path) || [];
      if (images.length > 0) {
        productData.images = images;
      }
      
      const product = await productService.createProduct(productData);
      
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all products with filtering
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        state,
        district,
        minPrice,
        maxPrice,
        search,
        status = 'ACTIVE',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        category: category as string,
        state: state as string,
        district: district as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        search: search as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      const result = await productService.getProducts(filters);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single product
  static async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new ApiError(400, 'Product ID is required');
      }
      
      const product = await productService.getProductById(id);
      
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product (Farmer only, own products)
  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      validateRequest(updateProductSchema, req);
      
      const { id } = req.params;
      const farmerId = (req as any).user.id;
      
      if (!id) {
        throw new ApiError(400, 'Product ID is required');
      }
      
      // Handle image uploads if present
      const updateData = { ...req.body };
      const images = (req as any).files?.map((file: any) => file.path);
      if (images?.length > 0) {
        updateData.images = images;
      }
      
      const product = await productService.updateProduct(id, farmerId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product (Farmer only, own products)
  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const farmerId = (req as any).user.id;
      
      if (!id) {
        throw new ApiError(400, 'Product ID is required');
      }
      
      await productService.deleteProduct(id, farmerId);
      
      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get farmer's products
  static async getFarmerProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const farmerId = (req as any).user.id;
      const { page = 1, limit = 20, status } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
      };

      const result = await productService.getFarmerProducts(farmerId, filters);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload product images
  static async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const farmerId = (req as any).user.id;
      
      if (!id) {
        throw new ApiError(400, 'Product ID is required');
      }
      
      const files = (req as any).files;
      if (!files || files.length === 0) {
        throw new ApiError(400, 'No images provided');
      }
      
      const imageUrls = files.map((file: any) => file.path);
      const product = await productService.addImages(id, farmerId, imageUrls);
      
      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: { images: product.images },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get product categories
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getCategories();
      
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}