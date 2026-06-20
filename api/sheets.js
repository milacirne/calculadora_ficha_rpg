import { list, put } from '@vercel/blob'

const defaultState = {
  theme: 'dark',
  activeCharacterIndex: 0,
  characters: [],
}

const backendVersion = '2026-06-20-cache-v4'

function getPlayerId(request) {
  const url = new URL(request.url, `https://${request.headers.host || 'localhost'}`)
  const playerId = url.searchParams.get('playerId')

  if (!playerId || !/^[a-zA-Z0-9_-]{12,80}$/.test(playerId)) {
    return null
  }

  return playerId
}

function sanitizeState(payload) {
  const data = typeof payload === 'string' ? JSON.parse(payload || '{}') : payload

  return {
    theme: data?.theme === 'light' ? 'light' : 'dark',
    activeCharacterIndex: Number(data?.activeCharacterIndex) || 0,
    characters: Array.isArray(data?.characters) ? data.characters.slice(0, 3) : [],
  }
}

function getErrorDetail(error) {
  if (!(error instanceof Error)) {
    return 'Erro desconhecido'
  }

  const cause = error.cause instanceof Error ? ` | cause: ${error.cause.message}` : ''

  return `${error.name}: ${error.message}${cause}`
}

export default async function handler(request, response) {
  const playerId = getPlayerId(request)

  if (!playerId) {
    response.status(400).json({ error: 'playerId invalido.' })
    return
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobToken) {
    response.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN nao configurado no projeto da Vercel.',
    })
    return
  }

  const pathname = `sheets/${playerId}.json`
  let stage = 'starting'

  try {
    if (request.method === 'GET') {
      response.setHeader('Cache-Control', 'no-store, max-age=0')
      response.setHeader('CDN-Cache-Control', 'no-store')
      response.setHeader('Vercel-CDN-Cache-Control', 'no-store')
      stage = 'listing'
      const existingFiles = await list({
        prefix: pathname,
        limit: 1,
        token: blobToken,
      })
      const existingFile = existingFiles.blobs.find((blob) => blob.pathname === pathname)

      if (!existingFile) {
        response.status(200).json({ ...defaultState, backendVersion })
        return
      }

      stage = 'reading'
      const blobUrl = new URL(existingFile.url)
      blobUrl.searchParams.set('cache', '0')
      const result = await fetch(blobUrl, {
        cache: 'no-store',
      })

      if (!result.ok) {
        const errorBody = (await result.text()).slice(0, 300)
        throw new Error(`Falha ao ler a ficha salva: ${result.status} ${result.statusText} | ${errorBody}`)
      }

      stage = 'parsing'
      const savedState = JSON.parse(await result.text())
      response.status(200).json({ ...sanitizeState(savedState), backendVersion })
      return
    }

    if (request.method === 'PUT') {
      stage = 'writing'
      const safeState = sanitizeState(request.body)

      await put(pathname, JSON.stringify(safeState, null, 2), {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
        token: blobToken,
      })

      response.status(200).json({ ok: true })
      return
    }

    response.setHeader('Allow', ['GET', 'PUT'])
    response.status(405).json({ error: 'Metodo nao permitido.' })
  } catch (error) {
    console.error('Erro em /api/sheets:', error)
    response.status(500).json({
      error: 'Nao foi possivel acessar o armazenamento.',
      stage,
      backendVersion,
      detail: getErrorDetail(error),
    })
  }
}
