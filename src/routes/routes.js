import { Router } from "express";

import { authRequired } from "../config/validateToken.js";
import { getHome } from "../controllers/routes.controllers.js";

const router = Router();

router.get('/', authRequired, getHome)


export default router