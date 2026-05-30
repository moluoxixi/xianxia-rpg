import type { HostMessagePayload, HostSettingsPayload } from '@xianxia-rpg/core';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { GameApiService } from './game-api.service';

@Controller('ai')
export class AIController {
  constructor(@Inject(GameApiService) private readonly gameApi: GameApiService) {}

  @Post('message')
  sendMessage(@Body() payload: HostMessagePayload): ReturnType<GameApiService['sendMessage']> {
    return this.gameApi.sendMessage(payload);
  }

  @Post('config/runtime')
  updateAIConfig(@Body() config: HostSettingsPayload): ReturnType<GameApiService['updateAIConfig']> {
    return this.gameApi.updateAIConfig(config);
  }

  @Post('config')
  saveAIConfig(@Body() config: HostSettingsPayload): ReturnType<GameApiService['saveAIConfig']> {
    return this.gameApi.saveAIConfig(config);
  }

  @Get('config')
  loadAIConfig(): ReturnType<GameApiService['loadAIConfig']> {
    return this.gameApi.loadAIConfig();
  }

  @Post('config/test')
  testAIConnection(@Body() config: Record<string, unknown>): ReturnType<GameApiService['testAIConnection']> {
    return this.gameApi.testAIConnection(config);
  }
}
