import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'DD-MM-YY HH:mm' }),
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }),
  ),
  transports: [
    new transports.Console(), // Логи в консоль
    new transports.File({ filename: 'error.log', level: 'error' }), // Логи ошибок в файл
    new transports.File({ filename: 'bot.log' }), // Все логи в файл
  ],
});

export default logger;
