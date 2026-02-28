import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PropertiesService } from './properties.service';
import { User } from '../users/entities/user.entity';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@ApiTags('properties')
@Controller('properties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo imóvel' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar imóveis do utilizador' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.propertiesService.findAll(user, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas dos imóveis' })
  async getStats(@CurrentUser() user: User) {
    return this.propertiesService.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um imóvel' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar imóvel' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover imóvel' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.propertiesService.remove(id, user);
  }
}
