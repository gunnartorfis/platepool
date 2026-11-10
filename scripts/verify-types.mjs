import { spawn } from 'node:child_process'
console.log(JSON.stringify({ event: 'types.start', constrainedMemory: process.constrainedMemory?.() }))
const child = spawn(process.execPath, ['--max-old-space-size=4096', 'node_modules/typescript/bin/tsc', '--noEmit'], { stdio: 'inherit' })
const timer = setInterval(() => console.log(JSON.stringify({ event: 'types.running' })), 15000)
child.on('error', () => { clearInterval(timer); process.exitCode = 1 })
child.on('close', (code, signal) => {
  clearInterval(timer)
  console.log(JSON.stringify({ event: 'types.complete', code, signal }))
  process.exitCode = code ?? 1
})
