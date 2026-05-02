import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export type UserDirectoryEntry = Pick<
  User,
  'id' | 'email' | 'firstName' | 'lastName' | 'role'
>;

/** Liste des utilisateurs pour constituer workflows / participants (sans données sensibles). */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findSignersDirectory(): Promise<UserDirectoryEntry[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
      where: { isActive: true },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }
}
