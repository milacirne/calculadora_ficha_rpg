import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, createReadStream } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const PORT = Number(process.env.PORT || 5174)
const rootDir = resolve(process.cwd())
const dataDir = join(rootDir, 'server', 'data')
const dataFile = join(dataDir, 'sheets.json')
const distDir = join(rootDir, 'dist')

const defaultState = {
  theme: 'dark',
  activeCharacterIndex: 0,
  characters: [],
}

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true })

  if (!existsSync(dataFile)) {
    await writeFile(dataFile, `${JSON.stringify(defaultState, null, 2)}\n`, 'utf8')
  }
}

function getDataFileForRequest(request) {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const playerId = url.searchParams.get('playerId')

  if (!playerId || !/^[a-zA-Z0-9_-]{12,80}$/.test(playerId)) {
    return dataFile
  }

  return join(dataDir, `${playerId}.json`)
}

async function ensureRequestDataFile(request) {
  const requestDataFile = getDataFileForRequest(request)

  await mkdir(dataDir, { recursive: true })
  if (!existsSync(requestDataFile)) {
    await writeFile(requestDataFile, `${JSON.stringify(defaultState, null, 2)}\n`, 'utf8')
  }

  return requestDataFile
}

async function readRequestBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(data))
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  response.end()
}

function serveStaticFile(request, response) {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname
  const filePath = resolve(distDir, `.${requestedPath}`)

  if (!filePath.startsWith(distDir) || !existsSync(filePath)) {
    const indexPath = join(distDir, 'index.html')

    if (!existsSync(indexPath)) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Build nao encontrado. Rode npm run build antes de npm run server.')
      return
    }

    createReadStream(indexPath).pipe(response)
    return
  }

  response.writeHead(200, {
    'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
  })
  createReadStream(filePath).pipe(response)
}

await ensureDataFile()

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`)

    if (request.method === 'OPTIONS') {
      sendEmpty(response, 204)
      return
    }

    if (url.pathname === '/api/sheets' && request.method === 'GET') {
      const requestDataFile = await ensureRequestDataFile(request)
      const contents = await readFile(requestDataFile, 'utf8')
      sendJson(response, 200, JSON.parse(contents || '{}'))
      return
    }

    if (url.pathname === '/api/sheets' && request.method === 'PUT') {
      const requestDataFile = await ensureRequestDataFile(request)
      const body = await readRequestBody(request)
      const payload = JSON.parse(body || '{}')
      const safePayload = {
        theme: payload.theme === 'light' ? 'light' : 'dark',
        activeCharacterIndex: Number(payload.activeCharacterIndex) || 0,
        characters: Array.isArray(payload.characters) ? payload.characters.slice(0, 3) : [],
      }

      await writeFile(requestDataFile, `${JSON.stringify(safePayload, null, 2)}\n`, 'utf8')
      sendJson(response, 200, { ok: true })
      return
    }

    serveStaticFile(request, response)
  } catch (error) {
    sendJson(response, 500, { error: 'Erro interno do servidor.' })
  }
}).listen(PORT, () => {
  console.log(`Servidor de fichas em http://127.0.0.1:${PORT}`)
})
