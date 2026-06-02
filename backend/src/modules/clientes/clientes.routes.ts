import { Router } from 'express';
import { listarClientes, cadastrarCliente, darBaixa, getLembretesCobranca } from './clientes.controller';

const router = Router();

// Rotas estáticas ANTES de rotas com parâmetro (:id)
router.get('/lembretes-cobranca', getLembretesCobranca);
router.get('/', listarClientes);
router.post('/', cadastrarCliente);
router.patch('/:id/baixa', darBaixa);

export default router;
