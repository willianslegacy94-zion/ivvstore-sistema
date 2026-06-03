import { Router } from 'express';
import { listarFluxo, registrarMovimento } from './fluxo.controller';

const router = Router();

router.get('/', listarFluxo);
router.post('/', registrarMovimento);

export default router;
