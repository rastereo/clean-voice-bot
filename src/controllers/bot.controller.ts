import { basename, extname, join } from 'path';
import { writeFileSync } from 'fs';
import { Document } from 'grammy/types';
import {
  CallbackQueryContext,
  CommandContext,
  Context,
  HearsContext,
  InlineKeyboard,
  InputFile,
} from 'grammy';

import logger from '../configs/logger';
import Ffmpeg from '../services/ffmpeg';
import getIsolationVoice from '../utils/getIsolationVoice';
import {
  errorDurationMessage,
  errorFormatMessage,
  fileInfoMessage,
  fileNotFoundMessage,
  notTextMessage,
  reuploadFileMessage,
  startMessage,
} from '../components/messages';

const audioIdStorage = new Map();

const ffmpeg = new Ffmpeg();

export const sendStartInfo = async (ctx: CommandContext<Context>) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: ${ctx.message?.text}`);

  const button = new InlineKeyboard()
    .text('🍩Поддержать проект', 'donate_button')
    .row()
    .text('👂Примеры', 'examples_button')
    .row();

  ctx.reply(startMessage, {
    reply_markup: button,
    parse_mode: 'MarkdownV2',
  });
};

export const sendExamples = async (
  ctx: CommandContext<Context> | CallbackQueryContext<Context>,
) => {
  logger.info(
    `${ctx.from?.id} ${ctx.from?.username}: clicked ${ctx.callbackQuery?.data ? ctx.callbackQuery.data : ctx.message?.text}`,
  );

  await ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/voice.mp3')),
  );
  await ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/voice_@cleanVoiceBot.mp3')),
  );
  await ctx.replyWithDocument(
    new InputFile(join(process.cwd(), 'src/assets/interview.mp3')),
  );
  await ctx.replyWithDocument(
    new InputFile(
      join(process.cwd(), 'src/assets/interview_@cleanVoiceBot.mp3'),
    ),
  );
};

export const sendAudioInfo = async (ctx: Context) => {
  const userId = ctx.from?.id;

  const fileData =
    ctx.msg?.document || ctx.msg?.audio || (ctx.msg?.voice as Document);

  if (!fileData) {
    return ctx.reply(fileNotFoundMessage);
  }

  const updateType: string = ctx.msg?.document
    ? 'document'
    : ctx.msg?.audio
      ? 'audio'
      : ctx.msg?.voice
        ? 'voice'
        : 'file';

  fileData.file_name = fileData.file_name
    ? fileData.file_name
    : ctx.msg?.voice
      ? 'voice'
      : 'unknown';

  const { file_size, mime_type, file_name, file_id } = fileData;

  const { file_path } = await ctx.api.getFile(file_id);

  if (file_path && file_size && mime_type && file_id) {
    const { stream, format } = await ffmpeg.getInfoAudio(file_path);

    if (format.format_name.includes(',')) {
      format.format_name = 'mp3';
    }

    if (stream.codec_type !== 'audio') {
      return ctx.reply(errorFormatMessage, {
        parse_mode: 'MarkdownV2',
      });
    }

    // const audioDuration: number = Math.round(
    //   await getAudioDurationInSeconds(filePath),
    // );

    if (
      Number(format.duration) > Number(process.env.GATE_MAX_DURATION) ||
      Number(format.duration) < Number(process.env.GATE_MIN_DURATION)
    ) {
      logger.error(
        `${ctx.from?.id} ${ctx.from?.username}: ${file_name} ${format.duration} Duration false ${file_path}`,
      );

      return ctx.reply(errorDurationMessage, {
        parse_mode: 'MarkdownV2',
      });
    }

    const button = new InlineKeyboard().text('Продолжить', `continue_button`);

    audioIdStorage.set(userId, {
      stream,
      format,
      file_name,
      file_path,
    });

    logger.info(
      `${ctx.from?.id} ${ctx.from?.username}: uploaded ${updateType} ${file_name ? file_name : ''} ${file_path}`,
    );

    return ctx.reply(
      fileInfoMessage(
        file_name,
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
};

export const sendIsolateAudio = async (ctx: CallbackQueryContext<Context>) => {
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

      if (format.filename) {
        const audioIsolationBuffer = await getIsolationVoice(
          format.filename,
          // file_name,
        );

        if (format.format_name === 'mp3') {
          logger.info(
            `${ctx.from?.id} ${ctx.from?.username}: sended mp3 file ${outputFilePath}`,
          );

          await writeFileSync(outputFilePath, audioIsolationBuffer);

          return await ctx.replyWithDocument(new InputFile(outputFilePath));
        }

        await ffmpeg.convertAudio(
          audioIsolationBuffer,
          outputFilePath,
          stream.sample_rate,
          format.bit_rate,
          format.format_name,
        );

        logger.info(
          `${ctx.from?.id} ${ctx.from?.username}: sended convert file ${outputFilePath}`,
        );

        if (file_name === 'voice') {
          return await ctx.replyWithVoice(new InputFile(outputFilePath));
        }

        return await ctx.replyWithDocument(new InputFile(outputFilePath));
      }
    } catch (err) {
      if (err instanceof Error) {
        console.log(err);
        logger.error(`${ctx.from?.id} ${ctx.from?.username}: ${err.message}`);

        // if (err.message === 'Forbidden') {
        //   await spawn('sudo wg-quick down wg0');
        //   await spawn('sudo wg-quick up wg0');
        // }

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
};

export const sendFormatMessage = (ctx: Context) => {
  logger.info(`${ctx.from?.id} ${ctx.from?.username}: uploaded photo or video`);

  ctx.reply(errorFormatMessage, {
    parse_mode: 'MarkdownV2',
  });
};

export const sendNotTextMessage = (ctx: Context) => {
  logger.info(
    `${ctx.from?.id} ${ctx.from?.username}: message ${ctx.msg?.text}`,
  );

  ctx.reply(notTextMessage);
};

export const exportLogs = async (ctx: HearsContext<Context>) => {
  if (ctx.from?.id === Number(process.env.ADMIN_ID)) {
    await ctx.replyWithDocument(new InputFile(join(process.cwd(), 'bot.log')));
    await ctx.replyWithDocument(
      new InputFile(join(process.cwd(), 'error.log')),
    );
  }
};
