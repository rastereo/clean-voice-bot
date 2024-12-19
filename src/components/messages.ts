export const startMessage = `Привет\\! 👋

Я [cleanVoiceBot](https://t.me/cleanvoicebot) — ваш помощник в очистке голоса от любых шумов\\! 🎙️

🚀 *Как это работает\\?*
1\\. Отправьте или перешлите мне аудио\\-файл\\.
2\\. Я обработаю его\\: удалю все шумы и оставлю только чистый голос\\.
3\\. Через несколько мгновений вы получите файл с чистым голосом\\.

💾 *Какие форматы поддерживаю\\?*
\\- MP3
\\- WAV
\\- AIFF
\\- OGG
\\- Голосовое сообщение

⏱ *Какой максимальный размер записи?*
Не больше 3 минут\\.

🔒 *Конфиденциальность\\?*
Ваши файлы обрабатываются анонимно, и после обработки они не сохраняются\\.

Пробуйте прямо сейчас или послушайте примеры\\! 💬`;

export const fileInfoMessage = (
  name: string,
  mimeType: string,
  sampleRate: string,
  fileSize: number,
  duration: number,
) => {
  return `<b>Name</b>: ${name}
<b>Format</b>: ${mimeType}
<b>Sample Rate</b>: ${sampleRate}
<b>Size</b>: ${fileSize} bytes
<b>Duration</b>: ${Math.round(duration)} seconds`;
};

export const errorFormatMessage = `❗Формат не поддерживается\\.

Только\\:
\\- *MP3*
\\- *WAV*
\\- *AIFF*

✨Попробуйте еще раз`;

export const errorDurationMessage = `❗Длительность аудио-файла превышает лимит в 3 минуты.

✨Попробуйте еще раз`;

export const fileNotFoundMessage = '❗Файл не найден'
