import OpenAI from 'openai'

let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openai
}

// Embed a single text string
export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8191), // ada-002 max tokens
  })
  return response.data[0].embedding
}

// Batch embed up to 100 texts at once (OpenAI limit)
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const chunks: string[][] = []
  for (let i = 0; i < texts.length; i += 100) {
    chunks.push(texts.slice(i, i + 100))
  }

  const embeddings: number[][] = []
  for (const chunk of chunks) {
    const response = await getOpenAI().embeddings.create({
      model: 'text-embedding-ada-002',
      input: chunk.map(t => t.slice(0, 8191)),
    })
    embeddings.push(...response.data.map(d => d.embedding))
  }

  return embeddings
}
