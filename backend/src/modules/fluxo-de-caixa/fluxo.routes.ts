import { Router } from 'express';
import { listarFluxo } from './fluxo.controller';

const router = Router();

router.get('/', listarFluxo);

export default router;
