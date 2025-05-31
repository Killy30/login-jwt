import { Router } from "express";
import { login, logout, signUp, verifyToken } from "../controllers/auth.controllers.js";

const router = Router()

router.post('/registrar', signUp)
router.post('/iniciar-sesion', login)
router.get('/salir', logout)
router.get('/auth/verify', verifyToken)

export default router