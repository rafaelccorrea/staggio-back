import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter dados do utilizador autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do utilizador' })
  async getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar perfil do utilizador' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Obter estatísticas do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas do utilizador' })
  async getStats(@CurrentUser() user: User) {
    return this.usersService.getDashboardStats(user.id);
  }
}
