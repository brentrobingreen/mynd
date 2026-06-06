import { Pinecone } from '@pinecone-database/pinecone'

let pinecone: Pinecone | null = null

export function getPinecone(): Pinecone {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })
  }
  return pinecone
}

export function getIndex() {
  return getPinecone().index(process.env.PINECONE_INDEX_NAME!)
}

// Each user gets their own namespace so highlights never cross-contaminate
export function getUserNamespace(userId: string): string {
  return `user-${userId}`
}

export const EMBEDDING_DIMENSION = 1536 // text-embedding-ada-002
export const PINECONE_METRIC = 'cosine'
