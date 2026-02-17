import { parse } from 'cookie'

export default function handleAuthIdentifier(request, env, response) {
    const cookies = parse(request.headers.get('Cookie') || '')
    let anonymousIdentifier = cookies[env.ANONYMOUS_SESSION_COOKIE_NAME]
    const userJwt = cookies[env.AUTHENTICATED_USER_JWT_COOKIE_NAME]

    // Anonymous cookie handling - if the user JWT and anonymous cookie are not present, generate a new one
    if (!userJwt && !anonymousIdentifier) {
        anonymousIdentifier = crypto.randomUUID()
        const headers = new Headers(response.headers)

        // Use getSetCookie() with fallback
        const allSetCookies = typeof headers.getSetCookie === 'function'
            ? headers.getSetCookie()
            : (headers.get('Set-Cookie') || '').split(/,(?=\s*\w+=)/)
        const originAlreadySetsAnon = allSetCookies.some((cookie) =>
            cookie?.startsWith(`${env.ANONYMOUS_SESSION_COOKIE_NAME}=`),
        )

        if (!originAlreadySetsAnon) {
            headers.append('Set-Cookie', `${env.ANONYMOUS_SESSION_COOKIE_NAME}=${anonymousIdentifier}; Path=/`)
            response = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            })
        }
    }

    const authIdentifier = userJwt ? { userJwt } : anonymousIdentifier ? { anonymousIdentifier } : {}

    return [response, authIdentifier]
}
