import { lookup } from 'node:dns/promises'
import { request } from 'node:https'
import { isIP } from 'node:net'

function publicIPv4(address: string) {
  if (isIP(address) !== 4) return false
  const [a, b] = address.split('.').map(Number)
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19].includes(b))
  )
}

// Resolve once and pin the connection address: checking DNS then calling fetch
// would permit DNS rebinding into Railway's private network. IPv4 is deliberate.
export async function fetchPublicHtml(
  input: string,
  redirects = 0,
): Promise<string> {
  const url = new URL(input)
  if (
    url.protocol !== 'https:' ||
    (url.port && url.port !== '443') ||
    url.username ||
    url.password ||
    isIP(url.hostname) ||
    url.hostname.startsWith('[')
  ) {
    throw new Error('A public HTTPS recipe URL is required')
  }
  const addresses = await lookup(url.hostname, { all: true, family: 4 })
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicIPv4(address))
  ) {
    throw new Error('Private recipe destinations are forbidden')
  }
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        family: 4,
        lookup: (_host, _options, callback) =>
          callback(null, addresses[0].address, 4),
        headers: { 'User-Agent': 'PlatePool/1.0', Accept: 'text/html' },
        signal: AbortSignal.timeout(15000),
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400
        ) {
          response.resume()
          if (!response.headers.location || redirects >= 3) {
            reject(new Error('Recipe redirect limit reached'))
          } else {
            resolve(
              fetchPublicHtml(
                new URL(response.headers.location, url).href,
                redirects + 1,
              ),
            )
          }
          return
        }
        if (
          response.statusCode !== 200 ||
          !response.headers['content-type']?.includes('text/html')
        ) {
          response.resume()
          reject(new Error('Recipe response must be HTML'))
          return
        }
        const chunks: Array<Buffer> = []
        let bytes = 0
        response.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > 2 * 1024 * 1024) {
            response.destroy(new Error('Recipe response too large'))
          } else chunks.push(chunk)
        })
        response.on('error', reject)
        response.on('end', () =>
          resolve(Buffer.concat(chunks).toString('utf8')),
        )
      },
    )
    req.on('error', reject)
    req.end()
  })
}
