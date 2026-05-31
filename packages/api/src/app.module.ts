import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { GameController } from './game.controller';
import { GameApiService } from './game-api.service';
import { NovelController } from './novel.controller';

@Module({
  controllers: [AIController, GameController, NovelController],
  providers: [GameApiService],
})
export class AppModule {}
