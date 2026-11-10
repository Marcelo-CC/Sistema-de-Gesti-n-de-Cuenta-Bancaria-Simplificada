import { Router } from 'express';
import * as ctrl from '../controllers/cuentaController.js';

const router = Router();

// Las rutas POST fijas se declaran antes que /:id para evitar ambigüedades.
router.get('/', ctrl.listar);
router.post('/deposito', ctrl.deposito);
router.post('/retiro', ctrl.retiro);
router.post('/transferencia', ctrl.transferencia);
router.get('/:id', ctrl.obtener);
router.get('/:id/historial', ctrl.historial);

export default router;
