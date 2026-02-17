/**
 * Fetch surface decisions from the MonetizationOS API.
 * Uses Fastly backend for the outgoing request instead of Cloudflare's direct fetch.
 * The Cloudflare-specific `cf` properties are omitted from the request body.
 */
export default async function fetchSurfaceDecisions(env, { surfaceSlug, anonymousIdentifier, userJwt, path }) {
    if (!env.MONETIZATION_OS_SECRET_KEY) {
        console.warn('MONETIZATION_OS_SECRET_KEY is not set, skipping surface decisions')
        return null
    }

    const host = env.MONETIZATION_OS_HOST || 'https://api.monetizationos.com'

    try {
        const response = await fetch(`${host}/api/v1/surface-decisions`, {
            method: 'POST',
            body: JSON.stringify({
                surfaceSlug,
                identity: {
                    anonymousIdentifier,
                    userJwt,
                },
                resource: {
                    id: path,
                },
            }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${env.MONETIZATION_OS_SECRET_KEY}`,
            },
            backend: 'monetization_api',
        })

        const data = await response.json()
        if (data.status === 'error') {
            throw new Error(data.message)
        }
        return data
    } catch (error) {
        console.error('Error fetching surface decisions:', error)
        return null
    }
}
