import { once } from 'node:events'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { buildE2EEnvironment } from './env'

const rootDir = fileURLToPath(new URL('../../../', import.meta.url))
const nuxiEntrypoint = fileURLToPath(
  new URL('../../../node_modules/@nuxt/cli/bin/nuxi.mjs', import.meta.url),
)
const serverPort = 3310
const serverUrl = `http://127.0.0.1:${serverPort}`

let serverProcess: ChildProcessWithoutNullStreams | null = null
let bufferedOutput = ''

function captureOutput(chunk: string | Buffer) {
  bufferedOutput += chunk.toString()
}

export function getForumServerUrl() {
  return serverUrl
}

export async function startForumServer() {
  if (serverProcess) {
    return
  }

  bufferedOutput = ''
  serverProcess = spawn(
    process.execPath,
    [nuxiEntrypoint, 'dev', '--host', '127.0.0.1', '--port', String(serverPort)],
    {
      cwd: rootDir,
      env: buildE2EEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  serverProcess.stdout.on('data', captureOutput)
  serverProcess.stderr.on('data', captureOutput)

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`Nuxt server exited before becoming ready.\n\n${bufferedOutput}`)
    }

    try {
      const response = await fetch(`${serverUrl}/api/forums`)

      if (response.ok) {
        return
      }
    } catch {
      // The dev server is still booting.
    }

    await delay(500)
  }

  throw new Error(`Nuxt server did not become ready in time.\n\n${bufferedOutput}`)
}

export async function stopForumServer() {
  if (!serverProcess) {
    return
  }

  const runningProcess = serverProcess

  serverProcess = null

  runningProcess.kill('SIGTERM')

  const [result] = await Promise.race([
    once(runningProcess, 'exit').then(() => ['exited'] as const),
    delay(5000).then(() => ['timeout'] as const),
  ])

  if (result === 'timeout') {
    runningProcess.kill('SIGKILL')
    await once(runningProcess, 'exit')
  }
}
