import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: any;
  sessionId?: string;
}

export async function createContext({ req, res }: { req: Request; res: Response }): Promise<GraphQLContext> {
  let user = null;
  let sessionId = null;

  // Extract token from headers
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Get user from database
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
          phone: true,
          phoneVerified: true,
          emailVerified: true,
        },
      });

      sessionId = decoded.sessionId;
    } catch (error) {
      // Token is invalid, user remains null
      console.log('Invalid token in GraphQL context');
    }
  }

  return {
    req,
    res,
    user,
    sessionId,
  };
}

// Helper function to require authentication in resolvers
export function requireAuth(user: any) {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Helper function to require specific role
export function requireRole(user: any, roles: string | string[]) {
  requireAuth(user);
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
  
  return user;
}

// Helper function to check if user owns resource
export function requireOwnership(user: any, resourceUserId: string) {
  requireAuth(user);
  
  if (user.id !== resourceUserId && user.role !== 'ADMIN') {
    throw new Error('Access denied. You can only access your own resources.');
  }
  
  return user;
}