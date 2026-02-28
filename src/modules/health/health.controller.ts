import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificar saúde da API' })
  @ApiResponse({ status: 200, description: 'API está funcionando' })
  check() {
    return {
      status: 'ok',
      service: 'Staggio API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
