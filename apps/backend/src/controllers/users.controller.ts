import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UsersService, UserDirectoryEntry } from '../services/users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des utilisateurs (aperçu workflow / participants)',
    description:
      'Champs limités : id, email, nom, rôle. Utile pour configurer signataires et étapes.',
  })
  async directory(): Promise<UserDirectoryEntry[]> {
    return this.usersService.findSignersDirectory();
  }
}
