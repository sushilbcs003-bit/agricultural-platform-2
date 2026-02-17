import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';

const prisma = new PrismaClient();

export class MachineryService {
  // Get machinery types by category
  async getMachineryTypes(category: 'FARMING' | 'TRANSPORT') {
    try {
      const categoryRecord = await prisma.machineryCategoryMaster.findUnique({
        where: { code: category },
        include: {
          types: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!categoryRecord) {
        throw new ApiError(404, 'Machinery category not found');
      }

      return categoryRecord.types;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to fetch machinery types');
    }
  }

  // Get supplier machinery inventory
  async getSupplierMachinery(supplierUserId: string) {
    try {
      const machinery = await prisma.supplierMachineryInventory.findMany({
        where: { supplierUserId },
        include: {
          machineryType: {
            include: {
              category: true,
            },
          },
          coverageAddress: {
            include: {
              village: {
                include: {
                  tehsil: {
                    include: {
                      district: {
                        include: {
                          state: {
                            include: {
                              country: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return machinery;
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch supplier machinery');
    }
  }

  // Add machinery to supplier inventory
  async addMachinery(
    supplierUserId: string,
    data: {
      machineryTypeId: string;
      quantity: number;
      coverageAddressId?: string;
      coverageRadiusKm?: number;
      availabilityStatus: string;
      capacityTons?: number;
      refrigeration?: boolean;
      horsepower?: number;
      suitableCrops?: string;
    }
  ) {
    try {
      // Verify supplier owns this user ID
      const supplier = await prisma.supplierProfile.findUnique({
        where: { userId: supplierUserId },
      });

      if (!supplier) {
        throw new ApiError(404, 'Supplier not found');
      }

      // Verify machinery type exists and is active
      const machineryType = await prisma.machineryTypeMaster.findUnique({
        where: { id: data.machineryTypeId },
        include: { category: true },
      });

      if (!machineryType || !machineryType.isActive) {
        throw new ApiError(400, 'Invalid or inactive machinery type');
      }

      // Validate type-specific fields
      if (machineryType.category.code === 'TRANSPORT') {
        if (data.horsepower !== undefined) {
          throw new ApiError(400, 'Horsepower is not applicable for transport machinery');
        }
      } else if (machineryType.category.code === 'FARMING') {
        if (data.capacityTons !== undefined || data.refrigeration !== undefined) {
          throw new ApiError(400, 'Capacity and refrigeration are not applicable for farming machinery');
        }
      }

      // Create machinery inventory
      const machinery = await prisma.supplierMachineryInventory.create({
        data: {
          supplierUserId,
          machineryTypeId: data.machineryTypeId,
          quantity: data.quantity,
          coverageAddressId: data.coverageAddressId,
          coverageRadiusKm: data.coverageRadiusKm,
          availabilityStatus: data.availabilityStatus as any,
          capacityTons: data.capacityTons,
          refrigeration: data.refrigeration,
          horsepower: data.horsepower,
          suitableCrops: data.suitableCrops,
        },
        include: {
          machineryType: {
            include: { category: true },
          },
        },
      });

      return machinery;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to add machinery');
    }
  }

  // Update machinery
  async updateMachinery(
    supplierUserId: string,
    machineryId: string,
    data: any
  ) {
    try {
      // Verify ownership
      const machinery = await prisma.supplierMachineryInventory.findUnique({
        where: { id: machineryId },
      });

      if (!machinery) {
        throw new ApiError(404, 'Machinery not found');
      }

      if (machinery.supplierUserId !== supplierUserId) {
        throw new ApiError(403, 'You can only modify your own machinery');
      }

      // Update machinery
      const updated = await prisma.supplierMachineryInventory.update({
        where: { id: machineryId },
        data: {
          quantity: data.quantity,
          coverageAddressId: data.coverageAddressId,
          coverageRadiusKm: data.coverageRadiusKm,
          availabilityStatus: data.availabilityStatus,
          capacityTons: data.capacityTons,
          refrigeration: data.refrigeration,
          horsepower: data.horsepower,
          suitableCrops: data.suitableCrops,
        },
        include: {
          machineryType: {
            include: { category: true },
          },
        },
      });

      return updated;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to update machinery');
    }
  }

  // Delete machinery
  async deleteMachinery(supplierUserId: string, machineryId: string) {
    try {
      // Verify ownership
      const machinery = await prisma.supplierMachineryInventory.findUnique({
        where: { id: machineryId },
      });

      if (!machinery) {
        throw new ApiError(404, 'Machinery not found');
      }

      if (machinery.supplierUserId !== supplierUserId) {
        throw new ApiError(403, 'You can only delete your own machinery');
      }

      // Check if machinery is linked to any orders
      const linkedOrders = await prisma.serviceOrderItem.findFirst({
        where: {
          machineryInventoryId: machineryId,
          serviceStatus: { not: 'CANCELLED' },
        },
      });

      if (linkedOrders) {
        throw new ApiError(400, 'Cannot delete machinery linked to active orders');
      }

      await prisma.supplierMachineryInventory.delete({
        where: { id: machineryId },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to delete machinery');
    }
  }

  // Browse farming machinery (for farmers)
  async browseFarmingMachinery(filters: {
    location?: { latitude: number; longitude: number; radiusKm?: number };
    availability?: string;
    machineryTypeId?: string;
  }) {
    try {
      const farmingCategory = await prisma.machineryCategoryMaster.findUnique({
        where: { code: 'FARMING' },
      });

      if (!farmingCategory) {
        throw new ApiError(404, 'Farming machinery category not found');
      }

      const where: any = {
        machineryType: {
          categoryId: farmingCategory.id,
        },
        availabilityStatus: filters.availability || { not: 'UNAVAILABLE' },
      };

      if (filters.machineryTypeId) {
        where.machineryTypeId = filters.machineryTypeId;
      }

      const machinery = await prisma.supplierMachineryInventory.findMany({
        where,
        include: {
          supplier: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          machineryType: {
            include: { category: true },
          },
          coverageAddress: {
            include: {
              village: {
                include: {
                  tehsil: {
                    include: {
                      district: {
                        include: {
                          state: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Filter by location if provided
      if (filters.location) {
        // TODO: Implement distance-based filtering
        // For now, return all results
      }

      return machinery;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to browse farming machinery');
    }
  }

  // Browse transport machinery (for farmers and buyers)
  async browseTransportMachinery(
    userId: string,
    userRole: string,
    filters: {
      location?: { latitude: number; longitude: number; radiusKm?: number };
      availability?: string;
      machineryTypeId?: string;
      hasRefrigeration?: boolean;
      minCapacity?: number;
    }
  ) {
    try {
      // For buyers, check if they have finalized products
      if (userRole === 'BUYER') {
        const hasFinalizedOrder = await prisma.order.findFirst({
          where: {
            buyerUserId: userId,
            status: { in: ['FINALIZED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
            orderType: { in: ['PRODUCE', 'MIXED'] },
          },
        });

        if (!hasFinalizedOrder) {
          throw new ApiError(403, 'Buyers can only browse transport after product finalization');
        }
      }

      const transportCategory = await prisma.machineryCategoryMaster.findUnique({
        where: { code: 'TRANSPORT' },
      });

      if (!transportCategory) {
        throw new ApiError(404, 'Transport machinery category not found');
      }

      const where: any = {
        machineryType: {
          categoryId: transportCategory.id,
        },
        availabilityStatus: filters.availability || { not: 'UNAVAILABLE' },
      };

      if (filters.machineryTypeId) {
        where.machineryTypeId = filters.machineryTypeId;
      }

      if (filters.hasRefrigeration !== undefined) {
        where.refrigeration = filters.hasRefrigeration;
      }

      if (filters.minCapacity) {
        where.capacityTons = { gte: filters.minCapacity };
      }

      const machinery = await prisma.supplierMachineryInventory.findMany({
        where,
        include: {
          supplier: {
            include: {
              user: {
                select: {
                  id: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          machineryType: {
            include: { category: true },
          },
          coverageAddress: {
            include: {
              village: {
                include: {
                  tehsil: {
                    include: {
                      district: {
                        include: {
                          state: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return machinery;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to browse transport machinery');
    }
  }
}

export const machineryService = new MachineryService();
