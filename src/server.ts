import express, { Express } from 'express';
import morgan from 'morgan';

import config from './config';

import healthRouter from './routes/health';
import jobsRouter from './routes/jobs';
import etlRouter from './routes/etl';

import Logger from './utils/logger';

const logger = Logger('Server');

let server: Express;

const init = () => {
  logger.info('Initializing web server...');
  server = express();

  server.set('json spaces', 4);
  server.use(
    morgan('tiny', {
      skip: (req, res) => {
        return ['/health/', '/health', '/'].includes(req.originalUrl);
      },
    }),
  );

  server.use('/', healthRouter);
  server.use('/health', healthRouter);
  server.use('/jobs', jobsRouter);
  server.use('/etl', etlRouter);

  const port = config.server.port;
  server.listen(port, () => {
    logger.info(`Server started. Listening on port ${port}.`);
  });
};

export default init;
