import { createLogger, LoggerOptions, transports, format } from 'winston';
import config from '../config';

import Timer from './timer';

const { combine, timestamp, colorize, printf } = format;
const options: LoggerOptions = {
  format: combine(
    colorize(),
    timestamp(),
    printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new transports.Console({
      level: config.logLevel ? config.logLevel : process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
};

const logger = createLogger(options);

export default (service: string, timer?: ReturnType<typeof Timer>) => {
  const buildServiceMessage = (...messages: (string | number | object)[]) => {
    const timeLog = timer ? ` (${timer.time()} | ${timer.step()})` : '';
    const strings: (string | number)[] = messages.map((m) => (typeof m === 'object' ? JSON.stringify(m, null, 2) : m));
    return `[${service}${timeLog}] ${strings.join(' - ')}`;
  };
  return {
    debug: (...messages: (string | number | object)[]) => logger.debug(buildServiceMessage(...messages)),
    info: (...messages: (string | number | object)[]) => logger.info(buildServiceMessage(...messages)),
    warn: (...messages: (string | number | object)[]) => logger.warn(buildServiceMessage(...messages)),
    error: (message: string, ...meta: any[]) => logger.error(buildServiceMessage(message), ...meta),
  };
};
