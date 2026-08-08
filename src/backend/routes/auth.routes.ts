import { Router } from 'express';
import { loginHandler, signupHandler, profileHandler } from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginHandler);
router.post('/signup', signupHandler);
router.get('/profile', profileHandler);

export default router;
