import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GenerationsService } from './generations.service';
import { User } from '../users/entities/user.entity';
import { GenerationType } from './entities/generation.entity';

@ApiTags('generations')
@Controller('generations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico de gerações' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false, enum: GenerationType })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: GenerationType,
  ) {
    return this.generationsService.findAll(user, page, limit, type);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de gerações' })
  async getStats(@CurrentUser() user: User) {
    return this.generationsService.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma geração' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.generationsService.findOne(id, user);
  }
}
