import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock user database
const mockUsers = new Map();

@Injectable()
export class PrismaMockService {
  user = {
    findUnique: async ({ where }) => {
      if (where.id) {
        return mockUsers.get(where.id);
      }
      if (where.email) {
        for (const user of mockUsers.values()) {
          if (user.email === where.email) {
            return user;
          }
        }
      }
      return null;
    },

    create: async ({ data }) => {
      const id = `user-${Date.now()}`;
      const user = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set(id, user);
      return user;
    },

    findMany: async () => {
      return Array.from(mockUsers.values());
    },
  };

  async $connect() {
    console.log('📊 Mock database connected');
    // Create test users
    const hashedPassword = await bcrypt.hash('test123', 10);
    const adminUser = {
      id: 'admin-1',
      email: 'admin@eufy.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.set(adminUser.id, adminUser);
  }

  async $disconnect() {
    console.log('📊 Mock database disconnected');
  }
}