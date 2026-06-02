import { Router } from 'express';
import { getAlertas } from './dashboard.controller';

const router = Router();

router.get('/alertas', getAlertas);

export default router;
