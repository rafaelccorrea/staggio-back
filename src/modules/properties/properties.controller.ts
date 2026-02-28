import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyQueryDto } from './dto/property.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo imóvel' })
  @ApiResponse({ status: 201, description: 'Imóvel criado com sucesso' })
  async create(
    @CurrentUser() user: User,
    @Body() createPropertyDto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(user.id, createPropertyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar imóveis do utilizador' })
  @ApiResponse({ status: 200, description: 'Lista de imóveis com paginação' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: PropertyQueryDto,
  ) {
    return this.propertiesService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um imóvel' })
  @ApiParam({ name: 'id', description: 'ID do imóvel' })
  @ApiResponse({ status: 200, description: 'Detalhes do imóvel' })
  @ApiResponse({ status: 404, description: 'Imóvel não encontrado' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar imóvel' })
  @ApiParam({ name: 'id', description: 'ID do imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel atualizado com sucesso' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user.id, id, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover imóvel' })
  @ApiParam({ name: 'id', description: 'ID do imóvel' })
  @ApiResponse({ status: 200, description: 'Imóvel removido com sucesso' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.propertiesService.remove(user.id, id);
    return { message: 'Imóvel removido com sucesso' };
  }
}
