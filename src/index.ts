import { Bot, BotError, Context, GrammyError, HttpError } from 'grammy';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

import logger from './configs/logger';
import {
  exportLogs,
  sendAudioInfo,
  sendExamples,
  sendFormatMessage,
  sendIsolateAudio,
  sendNotTextMessage,
  sendStartInfo,
} from './controllers/bot.controller';

dotenv.config();

const resultDirPath = join(
  process.cwd(),
  process.env.RESULTS_DIR_NAME || 'results',
);

const token = process.env.BOT_KEY || '';

const bot = new Bot(token, {
  client: {
    apiRoot: process.env.API_ROOT,
  },
});

if (!existsSync(resultDirPath)) {
  mkdirSync(resultDirPath)!;
}

bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Информация',
  },
  {
    command: 'examples',
    description: 'Примеры',
  },
]);

bot.hears('logs', exportLogs);

bot.command('start', sendStartInfo);

bot.command('examples', sendExamples);

bot.on([':document', ':audio', ':voice'], sendAudioInfo);

bot.on([':photo', ':video'], sendFormatMessage);

bot.callbackQuery('continue_button', sendIsolateAudio);

bot.callbackQuery('examples_button', sendExamples);

bot.on('message:text', sendNotTextMessage);

bot.catch((err: BotError<Context>) => {
  const ctx = err.ctx;
  const e = err.error;

  if (ctx) {
    logger.error(`Error while handling update ${ctx.update.update_id}:`);
  }

  if (e instanceof GrammyError) {
    logger.error(`Telegram API error: ${e.description}`);
  } else if (e instanceof HttpError) {
    logger.error(`HTTP error: ${e}`);
  } else {
    logger.error(`Unexpected error: ${e}`);
  }
});

bot.start();

logger.info('Bot is running');

process.on('SIGINT', () => {
  logger.info('Bot is stopping: Received SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Bot is stopping: Received SIGTERM');
  process.exit(0);
});

// // Optional: Log unhandled exceptions for debugging
// process.on('uncaughtException', (err) => {
//   logger.error(`Uncaught Exception: ${err.message}`, err);
//   process.exit(1);
// });

// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });
