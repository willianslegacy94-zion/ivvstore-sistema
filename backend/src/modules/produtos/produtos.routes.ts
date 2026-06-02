import { Router } from 'express';
import multer from 'multer';
import { listarProdutos, cadastrarProduto } from './produtos.controller';
import { importarNFe } from './nfe.controller';

const router = Router();

// Memória (sem salvar em disco) — NF-e XML é pequeno, 2 MB é mais que suficiente
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.originalname.endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XML são aceitos'));
    }
  },
});

router.get('/', listarProdutos);
router.post('/', cadastrarProduto);
router.post('/importar', upload.single('arquivo'), importarNFe);

export default router;
