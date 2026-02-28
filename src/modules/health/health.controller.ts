import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Verificar saúde da API' })
  check() {
    return {
      status: 'ok',
      app: 'Staggio API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
