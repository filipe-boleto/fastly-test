import { HTMLRewritingStream } from 'fastly:html-rewriter'

/**
 * Extracts all `<meta>` tags from the response, keyed by their `name` or `property` attribute.
 * Uses Fastly's HTMLRewritingStream (lol-html) for reliable, streaming HTML parsing.
 */
export async function parsePageMetadata(response) {
    const metadata = {}

    try {
        const transformer = new HTMLRewritingStream()
        transformer.onElement('meta', (element) => {
            const key = element.getAttribute('name') ?? element.getAttribute('property')
            const value = element.getAttribute('content')
            if (key && value !== null) {
                metadata[key] = value
            }
        })

        await new Response(response.body.pipeThrough(transformer)).text()
    } catch (err) {
        console.error('Error parsing page metadata', err)
    }

    return metadata
}
