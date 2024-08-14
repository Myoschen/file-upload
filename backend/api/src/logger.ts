import type { Request, Response, NextFunction } from 'express'
import pc from 'picocolors'

export default function logger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const time = new Date(Date.now()).toISOString()
    console.log(`${pc.bgWhite(pc.black(` ${req.method} `))} ${req.path} ${time}`)
    next()
  }
}