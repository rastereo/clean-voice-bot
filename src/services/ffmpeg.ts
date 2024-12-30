import { spawn } from 'child_process';

import { FFprobeResult } from '../types';

class Ffmpeg {
  private ffprobeCommand = (filePath: string) => [
    '-i',
    filePath,
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
  ];

  private ffmpegCommand = (
    sampleRate: string,
    bitRate: string,
    outputPath: string,
    formatName: string,
  ) => {
    if (formatName === 'ogg') {
      // https://stackoverflow.com/questions/56448384/telegram-bot-api-voice-message-audio-spectrogram-is-missing-a-bug
      return [
        '-y',
        '-i',
        'pipe:0',
        '-c:a',
        'libopus',
        '-b:a',
        '32k',
        '-vbr',
        'on',
        '-compression_level',
        '10',
        '-frame_duration',
        '60',
        '-application',
        'voip',
        outputPath,
      ];
    }

    return [
      '-y',
      '-i',
      'pipe:0',
      '-ar',
      sampleRate,
      '-b:a',
      bitRate,
      outputPath,
    ];
  };

  public getInfoAudio(filePath: string): Promise<FFprobeResult> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', this.ffprobeCommand(filePath));

      let output = '';
      let errors = '';

      ffprobe.stdout.on('data', (data) => {
        output += data;
      });

      ffprobe.stderr.on('data', (data) => {
        errors += data;
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(errors));
        }
        try {
          const { streams, format } = JSON.parse(output);

          const result = { stream: streams[0], format };

          resolve(result);
        } catch (err) {
          if (err instanceof Error) reject(new Error(err.message));
        }
      });
    });
  }

  public async convertAudio(
    buffer: Buffer,
    outputPath: string,
    sampleRate: string,
    bitRate: string,
    formatName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(
        'ffmpeg',
        this.ffmpegCommand(sampleRate, bitRate, outputPath, formatName),
      );

      ffmpeg.stdin.write(buffer);
      ffmpeg.stdin.end();

      // ffmpeg.stdout.on('data', (data) => {
      //   console.log(`stdout: ${data}`);
      // });

      // ffmpeg.stderr.on('data', (data) => {
      //   console.error(`stderr: ${data}`);
      // });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`Failed to start ffmpeg process: ${err.message}`));
      });
    });
  }
}

export default Ffmpeg;

// Да, можно выполнить это одной командой с использованием FFmpeg, без промежуточных файлов. Для этого используется возможность FFmpeg заменять аудиодорожку "на лету":

// bash
// Копировать код
// ffmpeg -i /path/to/input_video.MOV -i /path/to/new_audio.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest /path/to/output_video_with_new_audio.MOV
// Объяснение команды:
// -i /path/to/input_video.MOV: Указывает входной видеофайл.
// -i /path/to/new_audio.mp3: Указывает новый аудиофайл.
// -map 0:v: Берет видеопоток из первого файла (входное видео).
// -map 1:a: Берет аудиопоток из второго файла (новое аудио).
// -c:v copy: Копирует видеопоток без перекодирования.
// -c:a aac: Кодирует аудио в AAC (или другой кодек, если нужно).
// -shortest: Обрезает выходной файл по длине самого короткого потока (обычно аудио, чтобы избежать "пустого" видео в конце).
// Пример:
// bash
// Копировать код
// ffmpeg -i /home/rastereo/dev/telegram-bot-api/build/file_158.MOV -i /home/rastereo/dev/cleanVoiceBot/results/file_158@cleanVoiceBot.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest /home/rastereo/dev/telegram-bot-api/build/file_158_test.MOV
// Преимущества:
// Нет необходимости создавать промежуточный файл.
// Работает быстрее, так как не перекодирует видео.
// Уменьшает использование дискового пространства.
// Если нужно больше опций (например, буферизация или специфический кодек), напишите, и я помогу уточнить команду.
