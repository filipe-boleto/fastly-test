import fetchSurfaceDecisions from './fetchSurfaceDecisions'
import handleAuthIdentifier from './handleAuthIdentifier'

export default async function getSurfaceDecisions(request, env, response) {
    const [modifiedResponse, authIdentifier] = handleAuthIdentifier(request, env, response)

    const surfaceDecisions = await fetchSurfaceDecisions(env, {
        surfaceSlug: env.SURFACE_SLUG,
        ...authIdentifier,
        path: new URL(request.url).pathname,
    })

    return [modifiedResponse, surfaceDecisions]
}
