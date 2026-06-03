import { Router } from 'express';
import { getAlertas, getKpi } from './dashboard.controller';

const router = Router();

router.get('/kpi', getKpi);
router.get('/alertas', getAlertas);

export default router;
