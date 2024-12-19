import { Bot, InlineKeyboard, InputFile } from 'grammy';
import { existsSync, mkdirSync, writeFile, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { Document } from './types';
import dotenv from 'dotenv';
import { fromFile, stream } from 'file-type';
import getAudioDurationInSeconds from 'get-audio-duration';
import getIsolationVoice from './utils/getIsolationVoice';
import {
  startMessage,
  errorFormatMessage,
  errorDurationMessage,
  fileInfoMessage,
  fileNotFoundMessage,
} from './components/messages';
import Ffmpeg from './services/ffmpeg';

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
  // await ctx.editMessageReplyMarkup();

  const button = new InlineKeyboard().text('Примеры', 'examples_button');

  ctx.reply(startMessage, {
    reply_markup: button,
    parse_mode: 'MarkdownV2',
  });
});

bot.command('examples', async (ctx) => {
  // await ctx.editMessageReplyMarkup();

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

bot.on([':photo', ':video'], (ctx) => {
  ctx.reply(errorFormatMessage, {
    parse_mode: 'MarkdownV2',
  });
});

bot.on([':document', ':audio', ':voice'], async (ctx) => {
  // await ctx.editMessageReplyMarkup();

  const { file_size, mime_type, file_name, file_id } =
    ctx.msg.document || (ctx.msg.audio as Document) || ctx.msg.voice;

  const userId = ctx?.from?.id;

  const filePath = (await ctx.api.getFile(file_id)).file_path;

  if (filePath && file_size && mime_type && file_id) {
    const { stream, format } = await ffmpeg.getInfoAudio(filePath);

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
      return ctx.reply(errorDurationMessage);
    }

    const button = new InlineKeyboard().text('Продолжить', `continue_button`);

    audioIdStorage.set(userId, {
      stream,
      format,
      file_name: file_name || (ctx.msg.voice ? 'voice' : 'file'),
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
    return ctx.reply(fileNotFoundMessage);
  }
});

bot.callbackQuery('continue_button', async (ctx) => {
  const userId = ctx.from.id;

  if (audioIdStorage.has(userId)) {
    const { stream, format, file_name } = audioIdStorage.get(userId);

    console.log(audioIdStorage.get(userId));

    try {
      const outputFilePath = join(
        process.cwd(),
        process.env.RESULTS_DIR_NAME || '',
        `${basename(file_name, extname(file_name))}_@cleanVoiceBot.${format.format_name}`,
      );

      console.log(outputFilePath);

      // `./results/${fileName.split('.')[0]}_@cleanVoiceBot.${bufferFormat.ext}`;]]

      if (format.filename) {
        const audioIsolationBuffer = await getIsolationVoice(
          format.filename,
          file_name,
        );

        if (format.format_name === 'mp3') {
          await writeFileSync(outputFilePath, audioIsolationBuffer);

          return await ctx.replyWithAudio(
            new InputFile(outputFilePath),
            file_name,
          );
        }

        await ffmpeg.convertAudio(
          audioIsolationBuffer,
          outputFilePath,
          stream.sample_rate,
          format.bit_rate,
          format.format_name
        );

        if (file_name === 'voice') {
          // await writeFileSync(outputFilePath, audioIsolationBuffer);

          return await ctx.replyWithVoice(new InputFile(outputFilePath));
        }

        await ctx.replyWithAudio(new InputFile(outputFilePath), file_name);
      }
    } catch (err) {
      if (err instanceof Error) {
        ctx.reply(`❗${err.message}`);
      }
    }
  } else {
    ctx.reply(fileNotFoundMessage);
  }

  return await ctx.editMessageReplyMarkup();
});

bot.callbackQuery('examples_button', (ctx) => {
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

bot.start();
