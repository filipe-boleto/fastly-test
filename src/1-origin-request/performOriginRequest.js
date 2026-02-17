import getTargetUrl from './getTargetUrl'

export default function performOriginRequest(request, env) {
    const targetUrl = getTargetUrl(request.url, env.ORIGIN_URL)

    // Strip Accept-Encoding so the origin sends uncompressed content.
    // Unlike Cloudflare Workers, Fastly's fetch() does not auto-decompress
    // responses, so response.text() would fail on gzip-encoded bodies.
    const headers = new Headers(request.headers)
    headers.set('Accept-Encoding', 'identity')

    return fetch(new Request(targetUrl, { method: request.method, headers, body: request.body }), {
        backend: 'origin',
    })
}
