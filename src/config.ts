import * as dotenv from 'dotenv';
dotenv.config();

export default {
  logLevel: process.env.LOG_LEVEL,
  dnastack: {
    host: process.env.DNASTACK_DATA_TABLE_HOST as string,
  },
  elasticsearch: {
    host: process.env.ES_HOST as string,
    user: process.env.ES_USER, // optional
    password: process.env.ES_PASS, // optional
  },
  mongo: {
    host: process.env.MONGO_HOST as string,
    user: process.env.MONGO_USER, // optional
    password: process.env.MONGO_PASSWORD, // optional
    db: process.env.MONGO_DB as string,
  },
  rollcall: {
    host: process.env.ROLLCALL_HOST as string,
    alias: process.env.ROLLCALL_ALIAS as string,
    entity: process.env.ROLLCALL_ENTITY as string,
  },
  cron: {
    schedule: (process.env.ALL_STAGES_SCHEDULE as string) || '0 0 * * *',
  },
  server: {
    port: Number(process.env.SERVER_PORT) || 8081,
  },
};
