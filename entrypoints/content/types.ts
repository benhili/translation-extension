export type Chunk = {
    text: string
    meaning: string
    reading: string
}

export type Translation = {
    englishTranslation: string
    chunks: Chunk[]
}
