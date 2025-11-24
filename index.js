import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import cors from 'cors'

import { connectionDB } from './src/db/db.js'
import authRoutes from './src/routes/auth.routes.js';
import routes from './src/routes/routes.js';

const app = express()
connectionDB()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join('piblic')))

app.use("/api/nelvann-pos-system/", authRoutes)
app.use("/api/nelvann-pos-system/", routes)

app.listen(4000)
console.log('server listennig on port 4000')