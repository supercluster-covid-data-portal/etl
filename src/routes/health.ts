import { Router } from 'express';
import { getInmemoryQueueStatus } from '../stages';

const router: Router = Router();

router.get('/', (req, res) => {
  const queueStatus = getInmemoryQueueStatus();
  res.status(200).send({
    status: 'Running!',
    queueStatus,
  });
});
export default router;
