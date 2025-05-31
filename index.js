import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'

import { connectionDB } from './src/db/db.js'
import authRoutes from './src/routes/auth.routes.js';
import routes from './src/routes/routes.js';

const app = express()
connectionDB()

app.use(express.urlencoded({extended: false}))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join('piblic')))

app.use("/routes/", authRoutes)
app.use("/routes/", routes)

app.listen(4000)
console.log('server listennig on port 4000')