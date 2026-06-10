import { get, list, put } from '@vercel/blob'

const defaultState = {
  theme: 'dark',
  activeCharacterIndex: 0,
  characters: [],
}

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

async function streamToString(stream) {
  if (!stream) {
    return ''
  }

  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) {
      break
    }

    result += decoder.decode(value, { stream: true })
  }

  return result + decoder.decode()
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

  try {
    if (request.method === 'GET') {
      const existingFiles = await list({
        prefix: pathname,
        limit: 1,
        token: blobToken,
      })
      const fileExists = existingFiles.blobs.some((blob) => blob.pathname === pathname)

      if (!fileExists) {
        response.status(200).json(defaultState)
        return
      }

      const result = await get(pathname, {
        access: 'private',
        token: blobToken,
        useCache: false,
      })

      if (!result || result.statusCode !== 200) {
        response.status(200).json(defaultState)
        return
      }

      const savedState = JSON.parse(await streamToString(result.stream))
      response.status(200).json(sanitizeState(savedState))
      return
    }

    if (request.method === 'PUT') {
      const safeState = sanitizeState(request.body)

      await put(pathname, JSON.stringify(safeState, null, 2), {
        access: 'private',
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
      detail: getErrorDetail(error),
    })
  }
}
