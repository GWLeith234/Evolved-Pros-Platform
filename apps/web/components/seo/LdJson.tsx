import { jsonLdScriptHtml } from '@/lib/seo/jsonld'

/** One application/ld+json script. Not visible UI. */
export function LdJson({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(data) }}
    />
  )
}

/** CollectionPage and BreadcrumbList as separate scripts, same as articles. */
export function LdJsonGraph({ schemas }: { schemas: readonly object[] }) {
  return (
    <>
      {schemas.map(schema => {
        const type =
          '@type' in schema && typeof schema['@type'] === 'string' ? schema['@type'] : 'schema'
        return <LdJson key={type} data={schema} />
      })}
    </>
  )
}
