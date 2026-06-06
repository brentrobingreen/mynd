/**
 * Run once to create the Pinecone index:
 *   npx tsx scripts/setup-pinecone.ts
 *
 * Requires PINECONE_API_KEY and PINECONE_INDEX_NAME in .env.local
 */

import { Pinecone } from '@pinecone-database/pinecone'
import { config } from 'dotenv'

config({ path: '.env.local' })

const DIMENSION = 1536 // text-embedding-ada-002

async function main() {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const indexName = process.env.PINECONE_INDEX_NAME!

  const { indexes = [] } = await pc.listIndexes()
  const exists = indexes.some((idx) => idx.name === indexName)

  if (exists) {
    console.log(`Index "${indexName}" already exists — skipping creation.`)
    return
  }

  console.log(`Creating Pinecone index "${indexName}"...`)
  await pc.createIndex({
    name: indexName,
    dimension: DIMENSION,
    metric: 'cosine',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
  })

  console.log(`Index "${indexName}" created successfully.`)
}

main().catch(console.error)
