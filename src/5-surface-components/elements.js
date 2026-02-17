/**
 * Render a WebElement for use with Fastly's HTMLRewritingStream.
 * Returns content string and ElementRewriterOptions.
 *
 * Fastly uses { escapeHTML: true } for text content (inverse of Cloudflare's { html: true }).
 */
export function renderElementForStream(element) {
    try {
        const mapped = {
            ...element,
            type: element.type?.toLowerCase(),
        }

        if (mapped.type === 'html') {
            return { content: mapped.content, options: {} }
        }

        if (mapped.type === 'text') {
            return { content: mapped.content, options: { escapeHTML: true } }
        }

        if (mapped.type === 'element') {
            return { content: renderComponentElement(mapped), options: {} }
        }
    } catch (error) {
        console.error('Error rendering element:', error)
        return { content: '', options: { escapeHTML: true } }
    }

    console.warn(`Unsupported element type: ${element.type}`)
    return { content: '', options: { escapeHTML: true } }
}

export function renderComponentElement(component) {
    const [schemaSource, versionedSchemaId] = component.schema.split(':')
    const [schemaId, schemaVersion] = versionedSchemaId?.split('@') ?? []
    const webComponentTag = `${schemaSource}-${schemaId}`
    const escapedPropsAttribute = JSON.stringify(component.props).replace(/"/g, '&quot;')

    return `<${webComponentTag} version="${schemaVersion ?? ''}" props="${escapedPropsAttribute}"></${webComponentTag}>`
}

/**
 * Renders an array of WebElement objects into a single HTML string.
 */
export function renderElements(elements) {
    if (!elements?.length) return ''
    return elements
        .map((el) => {
            const rendered = renderElementForStream(el)
            if (!rendered.options?.escapeHTML) {
                return rendered.content
            }
            return escapeHtml(rendered.content)
        })
        .join('')
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
