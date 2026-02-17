import { Router } from 'express';
import { machineryController } from '../controllers/machineryController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get machinery types
router.get('/types', machineryController.getMachineryTypes.bind(machineryController));

// Supplier machinery management
router.get('/supplier/:id', machineryController.getSupplierMachinery.bind(machineryController));
router.post('/supplier/:id', machineryController.addMachinery.bind(machineryController));
router.put('/supplier/:id/:machineryId', machineryController.updateMachinery.bind(machineryController));
router.delete('/supplier/:id/:machineryId', machineryController.deleteMachinery.bind(machineryController));

// Browse machinery
router.get('/farming', machineryController.browseFarmingMachinery.bind(machineryController));
router.get('/transport', machineryController.browseTransportMachinery.bind(machineryController));

export default router;
