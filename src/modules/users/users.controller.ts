import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obter perfil do utilizador' })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Atualizar perfil' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() data: Partial<User>,
  ) {
    return this.usersService.updateProfile(user.id, data);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  async getDashboard(@CurrentUser() user: User) {
    return this.usersService.getDashboardStats(user.id);
  }
}
