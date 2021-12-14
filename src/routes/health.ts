import { Router } from 'express';

const router: Router = Router();

router.get('/', (req, res) => {
  res.status(200).send({
    status: 'Running!',
  });
});
export default router;
