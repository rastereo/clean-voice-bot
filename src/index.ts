import { Bot, GrammyError, HttpError, InlineKeyboard, InputFile } from 'grammy';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import dotenv from 'dotenv';

import getIsolationVoice from './utils/getIsolationVoice';
import {
  startMessage,
  errorFormatMessage,
  errorDurationMessage,
  fileInfoMessage,
  fileNotFoundMessage,
  reuploadFileMessage,
  notTextMessage,
} from './components/messages';
import Ffmpeg from './services/ffmpeg';
import logger from './configs/logger';

import { Document } from './types';

dotenv.config();

const resultDirPath = join(
  process.cwd(),
  process.env.RESULTS_DIR_NAME || 'results',
);

const token = process.env.BOT_KEY || '';

const audioIdStorage = new Map();

const ffmpeg = new Ffmpeg();

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

bot.command('start', async (ctx) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: ${ctx.message?.text}`);

  const button = new InlineKeyboard().text('Примеры', 'examples_button');

  ctx.reply(startMessage, {
    reply_markup: button,
    parse_mode: 'MarkdownV2',
  });
});

bot.command('examples', async (ctx) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: ${ctx.message?.text}`);

  ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/voice.mp3')),
  );
  ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/voice_@cleanVoiceBot.mp3')),
  );
  ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/interview.mp3')),
  );
  ctx.replyWithDocument(
    new InputFile(
      join(process.cwd(), 'src/assets/interview_@cleanVoiceBot.mp3'),
    ),
  );
});

bot.on([':document', ':audio', ':voice'], async (ctx) => {
  // await ctx.editMessageReplyMarkup();

  let updateType = '';

  if (ctx.msg.document) {
    updateType = ':document';
  } else if (ctx.msg.audio) {
    updateType = ':audio';
  } else if (ctx.msg.voice) {
    updateType = ':voice';
  }

  const { file_size, mime_type, file_name, file_id } =
    ctx.msg.document || (ctx.msg.audio as Document) || ctx.msg.voice;

  const userId = ctx?.from?.id;

  logger.info(
    `${ctx.from?.id} ${ctx.from?.username}: uploaded ${updateType} ${file_name ? file_name : ''}`,
  );

  const { file_path } = await ctx.api.getFile(file_id);

  if (file_path && file_size && mime_type && file_id) {
    const { stream, format } = await ffmpeg.getInfoAudio(file_path);

    // const fileFormat = await fromFile(filePath);

    if (stream.codec_type !== 'audio') {
      return ctx.reply(errorFormatMessage, {
        parse_mode: 'MarkdownV2',
      });
    }

    // const audioDuration: number = Math.round(
    //   await getAudioDurationInSeconds(filePath),
    // );

    if (Number(format.duration) > Number(process.env.GATE_DURATION)) {
      logger.error(
        `${ctx.from?.id} ${ctx.from?.username}: ${file_name} ${format.duration} Duration false`,
      );

      return ctx.reply(errorDurationMessage);
    }

    const button = new InlineKeyboard().text('Продолжить', `continue_button`);

    audioIdStorage.set(userId, {
      stream,
      format,
      file_name: file_name || (ctx.msg.voice ? 'voice' : 'file'),
      file_path,
    });

    return ctx.reply(
      fileInfoMessage(
        file_name || (ctx.msg.voice ? 'voice' : 'file'),
        stream.codec_long_name,
        stream.sample_rate,
        file_size,
        Number(stream.duration),
      ),
      {
        reply_markup: button,
        parse_mode: 'HTML',
      },
    );

    // return ctx.reply(`${fileFormat?.ext} ${fileFormat?.mime} ${Math.round(audioDuration)}`);
  } else {
    logger.error(
      `${ctx.from?.id} ${ctx.from?.username}: ${fileNotFoundMessage}} ${file_path}`,
    );
    return ctx.reply(fileNotFoundMessage);
  }
});

bot.on([':photo', ':video'], (ctx) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: uploaded photo or video`);

  ctx.reply(errorFormatMessage, {
    parse_mode: 'MarkdownV2',
  });
});

bot.on('message:text', (ctx) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: message ${ctx.msg.text}`);

  ctx.reply(notTextMessage)
});

bot.callbackQuery('continue_button', async (ctx) => {
  await ctx.editMessageReplyMarkup();

  const userId = ctx.from.id;

  if (audioIdStorage.has(userId)) {
    const { stream, format, file_name, file_path } = audioIdStorage.get(userId);

    logger.info(
      `${ctx.from?.id} ${ctx.from?.username}: clicked ${ctx.callbackQuery.data} ${file_name}`,
    );

    try {
      const outputFilePath = join(
        process.cwd(),
        process.env.RESULTS_DIR_NAME || '',
        `${basename(file_path, extname(file_path))}@cleanVoiceBot.${format.format_name}`,
      );

      // console.log(outputFilePath);

      // `./results/${fileName.split('.')[0]}_@cleanVoiceBot.${bufferFormat.ext}`;]]

      if (format.filename) {
        const audioIsolationBuffer = await getIsolationVoice(
          format.filename,
          file_name,
        );

        console.log(file_name);

        logger.info(
          `${ctx.from?.id} ${ctx.from?.username}: sended ${outputFilePath}`,
        );

        if (format.format_name === 'mp3') {
          await writeFileSync(outputFilePath, audioIsolationBuffer);

          console.log(file_name);

          return await ctx.replyWithDocument(new InputFile(outputFilePath));
        }

        await ffmpeg.convertAudio(
          audioIsolationBuffer,
          outputFilePath,
          stream.sample_rate,
          format.bit_rate,
          format.format_name,
        );

        if (file_name === 'voice') {
          return await ctx.replyWithVoice(new InputFile(outputFilePath));
        }

        logger.info(
          `${ctx.from?.id} ${ctx.from?.username}: ${ctx.callbackQuery.data} ${outputFilePath}`,
        );

        return await ctx.replyWithDocument(new InputFile(outputFilePath));
      }
    } catch (err) {
      if (err instanceof Error) {
        logger.error(`${ctx.from?.id} ${ctx.from?.username}: ${err.message}`);

        return ctx.reply(`❗${err.message}`);
      }
    }
  } else {
    logger.error(
      `${ctx.from?.id} ${ctx.from?.username}: clicked ${ctx.callbackQuery.data} File not found in audioStorage`,
    );

    return ctx.reply(reuploadFileMessage);
  }

  return await ctx.editMessageReplyMarkup();
});

bot.callbackQuery('examples_button', (ctx) => {
  logger.info(
    `${ctx.from?.id} ${ctx.from?.username}: clicked ${ctx.callbackQuery.data}`,
  );

  ctx.reply('Примеры:');
  ctx.replyWithAudio(
    new InputFile(join(process.cwd(), 'src/assets/voice.mp3')),
  );
  ctx.replyWithAudio(
    new InputFile(join(process.cwd(), 'src/assets/voice_@cleanVoiceBot.mp3')),
  );
  ctx.replyWithAudio(
    new InputFile(join(process.cwd(), 'src/assets/interview.mp3')),
  );
  ctx.replyWithAudio(
    new InputFile(
      join(process.cwd(), 'src/assets/interview_@cleanVoiceBot.mp3'),
    ),
  );
});

bot.catch((err) => {
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
