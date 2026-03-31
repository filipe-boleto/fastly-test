/// <reference types="@fastly/js-compute" />
import { Device } from 'fastly:device'
import { parsePageMetadata } from '../2-rewrite-origin-response/parsePageMetadata'
import type { Env, FastlyMetadata, SurfaceDecisionResponse } from '../types'
import fetchSurfaceDecisions from './fetchSurfaceDecisions'
import handleAuthIdentifier from './handleAuthIdentifier'

export default async function getSurfaceDecisions(
    event: FetchEvent,
    env: Env,
    response: Response,
): Promise<[Response, SurfaceDecisionResponse | null]> {
    const request = event.request
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

    const fastly = buildFastlyMetadata(event, request)

    const surfaceDecisions = await fetchSurfaceDecisions(env, {
        surfaceSlug: env.SURFACE_SLUG,
        ...authIdentifier,
        path: new URL(request.url).pathname,
        url: request.url,
        pageMetadata,
        fastly,
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

function buildFastlyMetadata(event: FetchEvent, request: Request): FastlyMetadata {
    const client = event.client

    // UA-based hardware/type classification (mobile, tablet, desktop, smart TV, etc.)
    // Distinct from WAF bot signals — this uses Fastly's Device Detection database.
    let deviceClassification: Device | null = null
    try {
        deviceClassification = Device.lookup(request.headers.get('user-agent') || '')
    } catch {
        // Device detection unavailable
    }

    // X-SigSci-* headers are set by Fastly's Next-Gen WAF (Signal Sciences) when enabled.
    // Tags include attack signals (SQLI, XSS, SCANNER...), bot signals (SUSPECTED-BOT,
    // VERIFIED-BOT.SEARCH-ENGINE-CRAWLER, SUSPECTED-BOT.AI-CRAWLER...) and informational
    // signals (BLOCKED, DATACENTER, TORNODE...).
    // Note: bot signals require an Edge WAF deployment — not available on Essential/Professional tiers.
    // Full signal reference: https://www.fastly.com/documentation/guides/next-gen-waf/signals/using-system-signals/
    const sigSciTags = request.headers.get('x-sigsci-tags')
    const sigSciRequestId = request.headers.get('x-sigsci-requestid')
    const waf =
        sigSciTags || sigSciRequestId
            ? {
                  tags: sigSciTags ? sigSciTags.split(',').map((t) => t.trim()) : [],
                  requestId: sigSciRequestId ?? null,
              }
            : undefined

    return {
        client: {
            address: client?.address ?? null,
            // geo is a plain Fastly object — passed as-is to preserve native
            // snake_case field names (country_code, as_number, postal_code, etc.)
            geo: (client?.geo ?? null) as Record<string, unknown> | null,
            tls: {
                protocol: client?.tlsProtocol ?? null,
                cipher: client?.tlsCipherOpensslName ?? null,
                ja3Hash: client?.tlsJA3MD5 ?? null,
                ja4: client?.tlsJA4 ?? null,
            },
        },
        deviceClassification,
        ...(waf ? { waf } : {}),
    }
}
