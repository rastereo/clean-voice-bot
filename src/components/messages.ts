export const startMessage = `Привет\\! 👋

Я [cleanVoiceBot](https://t.me/cleanvoicebot) — ваш AI помощник в очистке голоса от любых шумов\\! 🎙️

🚀 *Как это работает\\?*
1\\. Отправь или перешли мне аудио\\-файл\\.
2\\. Я обработаю его\\: удалю все шумы и оставлю только чистый голос\\.
3\\. Через несколько мгновений ты получишь файл в том же формате с чистым голосом\\.

💾 *Какие форматы поддерживаю\\?*
\\- Голосовые сообщения
\\- MP3
\\- WAV
\\- AIFF
\\- OGG

⏱ *Какой максимальный размер записи?*
\\- Не меньше 3 секунд\\.
\\- Не больше 3 минут\\.

✨Попробуй прямо сейчас или послушай примеры\\!

💬 Если есть вопросы или предложения напиши разработчику бота \\- @rastereo`;

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
\\- *Голосовые сообщения*
\\- *MP3*
\\- *WAV*
\\- *AIFF*
\\- *OGG*

✨Попробуйте еще раз`;

export const errorDurationMessage = `❗Длительность аудио-файла превышает лимит в 3 минуты.

✨Попробуйте еще раз`;

export const fileNotFoundMessage = '❗Файл не найден'

export const reuploadFileMessage = '❗Вы загрузили новый файл. Если вы хотите обработать этот файл, загрузите или перешлите его заново'

export const notTextMessage = '❗Я не принимаю текстовые сообщения. Если есть вопросы напишите разработчику этого бота - @rastereo'
