import type { HostNovelSearchResult, NovelSearchPayload } from '@xianxia-rpg/core';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { GameApiService } from './game-api.service';

@Controller('novels')
export class NovelController {
  constructor(@Inject(GameApiService) private readonly gameApi: GameApiService) {}

  @Post('search')
  searchNovels(@Body() payload: NovelSearchPayload): Promise<HostNovelSearchResult> {
    return this.gameApi.searchNovels(payload);
  }
}
