/// <reference types="@fastly/js-compute" />
import { loadEnv } from './env'
import customEndpointRequest from './1-origin-request/customEndpointRequest'
import performOriginRequest from './1-origin-request/performOriginRequest'
import rewriteOriginResponse from './2-rewrite-origin-response/rewriteOriginResponse'
import getSurfaceDecisions from './3-surface-decisions/getSurfaceDecisions'
import handleSurfaceBehavior from './4-surface-behavior/handleSurfaceBehavior'
import handleSurfaceComponents from './5-surface-components/handleSurfaceComponents'

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)))

async function handleRequest(event) {
    const request = event.request
    const env = await loadEnv()

    // Step 1: Origin request
    const customEndpointResponse = await customEndpointRequest(request, env)
    if (customEndpointResponse) {
        return customEndpointResponse
    }

    const originResponse = await performOriginRequest(request, env)
    if (!originResponse.headers.get('Content-Type')?.startsWith('text/html')) {
        return originResponse
    }

    try {
        // Step 2: Rewrite Origin Links
        const rewrittenResponse = await rewriteOriginResponse(request, env, originResponse)
        if (!rewrittenResponse) {
            return originResponse
        }

        // Step 3: MonetizationOS Surface Decisions
        const [modifiedResponse, surfaceDecisions] = await getSurfaceDecisions(request, env, rewrittenResponse)
        if (!surfaceDecisions) {
            return modifiedResponse
        }

        // Step 4: Apply Surface Behavior
        const [surfaceDecisionResponse, returnImmediately] = handleSurfaceBehavior(modifiedResponse, surfaceDecisions)
        if (returnImmediately) {
            return surfaceDecisionResponse
        }

        // Step 5: Apply Surface Component Behaviors
        return await handleSurfaceComponents(surfaceDecisionResponse, surfaceDecisions, env)
    } catch (err) {
        console.error('Error processing response', err)
        return originResponse
    }
}
