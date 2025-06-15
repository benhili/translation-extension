import React, { useEffect, useRef, useState } from "react";
import catGif from '@/assets/cat.gif';
import './TranslationPopup.css';
import { Translation, Chunk } from './types';
import getTranslation from './translation-api';
import { parse } from "partial-json";

const rectIsAbove = (rect: DOMRect) => rect.bottom > window.innerHeight / 2;
const rectIsRight = (rect: DOMRect): boolean => rect.left > window.innerWidth / 2;

type Coords = {
    top: number;
    left: number;
}

const getCoordsForRect = (rect: DOMRect): Coords => {
    const top = window.scrollY + (rectIsAbove(rect) ? rect.top - 12 : rect.bottom + 12)
    const left = window.scrollX + (rectIsRight(rect) ? rect.right : rect.left)
    return { top, left };
}


const EnglishTranslation = ({ translation }: { translation?: string }) => <h2 className='translation'>{translation}</h2>

const VocabularyBreakdown = ({ chunks }: { chunks?: Chunk[] }) => {
    if (!chunks || chunks.length === 0) {
        return <img src={catGif} alt="loading" className="loading" />
    }
    return (
        <div className='breakdown'>
            {chunks.map((chunk: Chunk, index) => {
                return (
                    <p key={index}>
                        <b>{chunk?.text}: </b>
                        {chunk?.meaning}
                    </p>
                )
            })}
        </div>)
}

type PopupProps = {
    translation: Translation;
    rect: DOMRect | null;
}

type ButtonProps = {
    prompt: string;
    rect: DOMRect | null;
}

const TranslationPopup = ({ translation, rect }: PopupProps) => {
    if (!rect) return null;

    const { left, top } = getCoordsForRect(rect)

    return (
        <div
            id="root"
            data-above={rectIsAbove(rect)}
            data-right={rectIsRight(rect)}
            style={{
                '--popup-left': `${left}px`,
                '--popup-top': `${top}px`,
            } as React.CSSProperties}
        >
            <EnglishTranslation translation={translation.englishTranslation} />
            <VocabularyBreakdown chunks={translation.chunks} />
        </div>
    );
}

const TranslationButton = ({ prompt, rect }: ButtonProps) => {
    const [showPopup, setShowPopup] = useState(false);
    const [translation, setTranslation] = useState<Translation | null>(null);
    const [partial, setPartial] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    if (!rect) return null;

    const handleClick = async () => {
        setLoading(true);
        setPartial("");
        setTranslation(null);
        setShowPopup(true);

        // Stream handler
        const onChunk = (chunk: string) => {
            setPartial(prev => prev + chunk);
        };

        try {
            const result = await getTranslation(prompt, onChunk);
            setTranslation(result);
            setPartial(""); // Clear the partial when done
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!showPopup) return;
        function handleOutsideClick(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setShowPopup(false);
                setPartial("");
                setTranslation(null);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [showPopup]);

    const { left, top } = getCoordsForRect(rect);

    const partialResult = partial ? parse(partial) : {};
    if (showPopup) {
        return (
            translation ?
                (<TranslationPopup translation={translation} rect={rect} />) :
                (<TranslationPopup translation={partialResult as Translation} rect={rect} />)
        );
    }

    return (
        <button
            data-above={rectIsAbove(rect)}
            data-right={rectIsRight(rect)}
            className="cat-button"
            style={{
                '--popup-left': `${left}px`,
                '--popup-top': `${top}px`,
            } as React.CSSProperties}
            onClick={handleClick}
            disabled={loading}
        >
            <img
                style={{
                    width: "70%",
                    height: "70%",
                    objectFit: "contain",
                    display: "block",
                }}
                src={catGif}
                alt="cat"
                className="cat-gif"
            />
        </button>
    );
};


const TranslationWrapper = ({ prompt, rect }: ButtonProps) => {
    return (
        <TranslationButton prompt={prompt} rect={rect} />
    );
}
export default TranslationWrapper;