import { Router } from 'express';
import { inMemoryQueue } from '../stages';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send({
    status: 'Running!',
    pending: inMemoryQueue.getPendingLength(),
    inflight: inMemoryQueue.getQueueLength(),
  });
});
export default router;
