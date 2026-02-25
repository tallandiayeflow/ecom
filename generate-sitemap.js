import { SitemapStream, streamToPromise } from 'sitemap'
import { writeFileSync } from 'fs'

const sitemap = new SitemapStream({
  hostname: 'https://noor-boutique.com'
})

const pages = [
  '/',
  '/products',
  '/cart',
  '/contact'
]

async function generate() {
  pages.forEach(page => sitemap.write({ url: page, changefreq: 'weekly', priority: 0.8 }))
  sitemap.end()

  const data = await streamToPromise(sitemap)
  writeFileSync('./dist/sitemap.xml', data.toString())
}

generate()