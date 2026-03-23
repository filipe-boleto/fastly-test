import { parsePageMetadata } from '../2-rewrite-origin-response/parsePageMetadata'
import fetchSurfaceDecisions from './fetchSurfaceDecisions'
import handleAuthIdentifier from './handleAuthIdentifier'

export default async function getSurfaceDecisions(request, env, response) {
    const [modifiedResponse, authIdentifier] = handleAuthIdentifier(request, env, response)

    const [metadataStream, passThroughStream] = modifiedResponse.body?.tee() ?? [null, null]
    const pageMetadata = metadataStream
        ? await parsePageMetadata(
              new Response(metadataStream, {
                  status: modifiedResponse.status,
                  statusText: modifiedResponse.statusText,
                  headers: modifiedResponse.headers,
              }),
          )
        : {}

    const surfaceDecisions = await fetchSurfaceDecisions(env, {
        surfaceSlug: env.SURFACE_SLUG,
        ...authIdentifier,
        path: new URL(request.url).pathname,
        url: request.url,
        pageMetadata,
    })

    return [
        passThroughStream
            ? new Response(passThroughStream, {
                  status: modifiedResponse.status,
                  statusText: modifiedResponse.statusText,
                  headers: modifiedResponse.headers,
              })
            : modifiedResponse,
        surfaceDecisions,
    ]
}
