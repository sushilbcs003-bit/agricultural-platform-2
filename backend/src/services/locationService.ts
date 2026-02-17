import { PrismaClient } from '@prisma/client';
import { ApiError } from '../utils/apiError';

const prisma = new PrismaClient();

export class LocationService {
  // Search LGD villages
  async searchLGDVillages(query: string, limit: number = 20) {
    try {
      const villages = await prisma.village.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { lgdCode: { contains: query, mode: 'insensitive' } },
          ],
        },
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
        take: limit,
        orderBy: { name: 'asc' },
      });

      return villages.map(village => ({
        id: village.id,
        name: village.name,
        lgdCode: village.lgdCode,
        tehsil: village.tehsil.name,
        district: village.tehsil.district.name,
        state: village.tehsil.district.state.name,
        country: village.tehsil.district.state.country.name,
        fullPath: `${village.name}, ${village.tehsil.name}, ${village.tehsil.district.name}, ${village.tehsil.district.state.name}`,
      }));
    } catch (error) {
      throw new ApiError(500, 'Failed to search villages');
    }
  }

  // Create address from location data
  async createAddress(data: {
    countryId: string;
    stateId?: string;
    districtId?: string;
    tehsilId?: string;
    villageId?: string;
    line1?: string;
    line2?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
  }) {
    try {
      // Verify country exists
      const country = await prisma.country.findUnique({
        where: { id: data.countryId },
      });

      if (!country) {
        throw new ApiError(400, 'Invalid country');
      }

      // Verify hierarchy if provided
      if (data.villageId) {
        const village = await prisma.village.findUnique({
          where: { id: data.villageId },
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
        });

        if (!village) {
          throw new ApiError(400, 'Invalid village');
        }

        // Auto-fill hierarchy from village
        data.tehsilId = village.tehsilId;
        data.districtId = village.tehsil.districtId;
        data.stateId = village.tehsil.district.stateId;
      } else if (data.tehsilId) {
        const tehsil = await prisma.tehsil.findUnique({
          where: { id: data.tehsilId },
          include: {
            district: {
              include: {
                state: true,
              },
            },
          },
        });

        if (tehsil) {
          data.districtId = tehsil.districtId;
          data.stateId = tehsil.district.stateId;
        }
      } else if (data.districtId) {
        const district = await prisma.district.findUnique({
          where: { id: data.districtId },
          include: {
            state: true,
          },
        });

        if (district) {
          data.stateId = district.stateId;
        }
      }

      const address = await prisma.address.create({
        data: {
          countryId: data.countryId,
          stateId: data.stateId,
          districtId: data.districtId,
          tehsilId: data.tehsilId,
          villageId: data.villageId,
          line1: data.line1,
          line2: data.line2,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
        },
        include: {
          country: true,
          state: true,
          district: true,
          tehsil: true,
          village: true,
        },
      });

      return address;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to create address');
    }
  }

  // Get address by ID
  async getAddress(addressId: string) {
    try {
      const address = await prisma.address.findUnique({
        where: { id: addressId },
        include: {
          country: true,
          state: true,
          district: true,
          tehsil: true,
          village: true,
        },
      });

      if (!address) {
        throw new ApiError(404, 'Address not found');
      }

      return address;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Failed to get address');
    }
  }

  // Get default country (India)
  async getDefaultCountry() {
    try {
      let country = await prisma.country.findFirst({
        where: { name: 'India' },
      });

      if (!country) {
        // Create India if it doesn't exist
        country = await prisma.country.create({
          data: {
            name: 'India',
            isoCode: 'IN',
          },
        });
      }

      return country;
    } catch (error) {
      throw new ApiError(500, 'Failed to get default country');
    }
  }
}

export const locationService = new LocationService();
