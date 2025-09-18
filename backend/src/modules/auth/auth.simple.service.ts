import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Mock user database
const mockUsers = new Map<string, any>([
  ['admin-1', {
    id: 'admin-1',
    email: 'admin@eufy.com',
    username: 'admin',
    password: '$2b$10$YourHashedPasswordHere', // Will be replaced on init
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  }]
]);

@Injectable()
export class AuthSimpleService {
  constructor(
    private jwtService: JwtService,
  ) {
    // Initialize with proper hashed password
    this.initializeTestUsers();
  }

  private async initializeTestUsers() {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const adminUser = mockUsers.get('admin-1');
    if (adminUser) {
      adminUser.password = hashedPassword;
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    // Find user by email
    let user = null;
    for (const u of mockUsers.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }

    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async register(email: string, username: string, password: string) {
    // Check if user exists
    for (const u of mockUsers.values()) {
      if (u.email === email) {
        throw new UnauthorizedException('User already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `user-${Date.now()}`,
      email,
      username,
      password: hashedPassword,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.set(newUser.id, newUser);

    const { password: _, ...result } = newUser;
    
    const payload = { 
      sub: newUser.id, 
      email: newUser.email,
      role: newUser.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: result.id,
        email: result.email,
        username: result.username,
        role: result.role,
        createdAt: result.createdAt,
      },
    };
  }

  async getUserById(userId: string) {
    const user = mockUsers.get(userId);
    if (!user) return null;

    const { password: _, ...result } = user;
    return result;
  }
}