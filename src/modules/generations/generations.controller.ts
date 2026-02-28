import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GenerationsService } from './generations.service';
import { GenerationQueryDto } from './dto/generation-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('generations')
@ApiBearerAuth()
@Controller('generations')
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar histórico de gerações' })
  @ApiResponse({ status: 200, description: 'Lista de gerações com paginação' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: GenerationQueryDto,
  ) {
    return this.generationsService.findAll(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de gerações' })
  @ApiResponse({ status: 200, description: 'Estatísticas de uso de IA' })
  async getStats(@CurrentUser() user: User) {
    return this.generationsService.getStats(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma geração' })
  @ApiParam({ name: 'id', description: 'ID da geração' })
  @ApiResponse({ status: 200, description: 'Detalhes da geração' })
  @ApiResponse({ status: 404, description: 'Geração não encontrada' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.generationsService.findOne(user.id, id);
  }
}
