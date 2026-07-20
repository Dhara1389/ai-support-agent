import { Router } from 'express';
import {
  connectAndInspect,
  generateAndRunQuery,
  getSchema,
  disconnectDb,
  listConnections,
} from './db-analyser.controller';
import { verifyToken } from '../../modules/auth/auth.middleware';

const router = Router();

// All routes protected by verifyToken middleware
router.post('/connect', verifyToken, connectAndInspect);
router.post('/query', verifyToken, generateAndRunQuery);
router.get('/schema/:connectionId', verifyToken, getSchema);
router.delete('/disconnect/:connectionId', verifyToken, disconnectDb);
router.get('/connections', verifyToken, listConnections);

export default router;