import { Translation } from "./types";

const getTranslation = async (selectedText: string, onChunk?: (chunk: string) => void): Promise<Translation> => {
    const response = await fetch("http://localhost:3000/translate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ translationText: selectedText })
    });

    if (response.body && onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            onChunk(chunk);
        }
        // Try to parse the final result as JSON
        try {
            const data = JSON.parse(result);
            return data;
        } catch (e) {
            throw new Error("Failed to parse streamed translation response");
        }
    } else {
        const data = await response.json();
        console.info("Translation response:", data);
        return data;
    }
};

export default getTranslation;