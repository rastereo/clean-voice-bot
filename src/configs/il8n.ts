import { I18n } from '@grammyjs/i18n';
import { MyContext } from '../types';
import path from 'path';

const i18n = new I18n<MyContext>({
  defaultLocale: 'en',
  directory: path.resolve(__dirname, '../locales'), // Загрузите все файлы перевода из locales/.
});

export default i18n;
