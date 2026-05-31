import type { HostDeleteGamePayload, HostInventoryPinsLoadPayload, HostInventoryPinsPayload, HostLoadGameByRunIdPayload } from '@xianxia-rpg/core';
import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { GameApiService } from './game-api.service';

@Controller('game')
export class GameController {
  constructor(@Inject(GameApiService) private readonly gameApi: GameApiService) {}

  @Post('save')
  saveGame(@Body() data: Record<string, unknown>): Promise<{ success: boolean; message: string; data: unknown; runId: string }> {
    return this.gameApi.saveGame(data);
  }

  @Get('latest')
  loadLatestGame(): Promise<{ success: boolean; data: unknown }> {
    return this.gameApi.loadLatestGame();
  }

  @Post('load')
  loadGameByRunId(@Body() payload: HostLoadGameByRunIdPayload): Promise<{ success: boolean; data: unknown }> {
    return this.gameApi.loadGameByRunId(payload.runId);
  }

  @Get('saves')
  listGameSaves(): ReturnType<GameApiService['listGameSaves']> {
    return this.gameApi.listGameSaves();
  }

  @Post('delete')
  deleteGame(@Body() payload: HostDeleteGamePayload): ReturnType<GameApiService['deleteGame']> {
    return this.gameApi.deleteGame(payload.runId);
  }

  @Post('death-archives')
  saveDeathArchive(@Body() data: Record<string, unknown>): Promise<{ success: boolean; message: string; data: unknown; runId: string }> {
    return this.gameApi.saveDeathArchive(data);
  }

  @Post('inventory-pins')
  saveInventoryPins(@Body() payload: HostInventoryPinsPayload): Promise<{ success: boolean; message: string; data: string[]; runId: string }> {
    return this.gameApi.saveInventoryPins(payload);
  }

  @Post('inventory-pins/load')
  loadInventoryPins(@Body() payload: HostInventoryPinsLoadPayload): Promise<{ success: boolean; data: string[] }> {
    return this.gameApi.loadInventoryPins(payload.runId);
  }
}
