import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './db/pool';
import produtosRoutes from './modules/produtos/produtos.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import clientesRoutes from './modules/clientes/clientes.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/produtos', produtosRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/clientes', clientesRoutes);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`[IVSSTORE] Server running on http://localhost:${PORT}`);
});
