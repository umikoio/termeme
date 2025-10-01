/// <reference types="node" />

/*
    Compact type list for all possible options when generating a meme
*/
export default async function TerminalMeme(
    input: string,
    topText?: string,
    bottomText?: string,
    layout?: string,
    saveImg?: string,
    stroke?: number,
    fontfamily?: string,
    fontColor?: string,
    strokecolor?: string,
    noUpper?: boolean,
    margin?: number,
    maxLines?: number,
    fontSize?: number,
    width?: number
): Promise<{ buffer: Buffer<ArrayBufferLike>; meme: string; saved?: string }>
