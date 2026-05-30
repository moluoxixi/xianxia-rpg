import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { GameController } from './game.controller';
import { GameApiService } from './game-api.service';

@Module({
  controllers: [AIController, GameController],
  providers: [GameApiService],
})
export class AppModule {}
