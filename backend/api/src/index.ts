import express from 'express'
import cors from 'cors'
import multer from 'multer'
import logger from './logger'
import { exec } from 'child_process'

const upload = multer()
const app = express()
const port = process.env.PORT ?? 4000

// middlewares
app.use(express.json())
app.use(cors())
app.use(logger())

// index route
app.get('/', (req, res) => {
  res.json({ data: { message: 'Hello World!' } })
})

// file route
app.post('/file', upload.single('file'), (req, res) => {
  if (req.file) {
    console.log('body', req.file.originalname)
    // NOTE save it to database
    res.status(200).json({ data: { message: 'Success' } })
  } else {
    res.status(500).json({ data: { message: 'Internal Server Error' } })
  }
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})

process.stdin.setEncoding('utf-8')

process.stdin.on('data', (input) => {
  const command = input.toString().trim()

  switch (command) {
    case 'h':
      console.log('c - clear')
      console.log('q - quit')
      console.log('h - help')
      break
    case 'c':
      exec('clear', (_, stdout) => console.log(stdout))
      break
    case 'q':
      process.exit()
  }
})