import { Router } from 'express';
import { registrarVenda } from './vendas.controller';

const router = Router();

router.post('/', registrarVenda);

export default router;
