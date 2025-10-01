#!/usr/bin/env node

// |--------------------------------|
//                                  |
// | Termeme Library                |
//                                  |
// |--------------------------------|

/*
    Author: Umiko (https://github.com/umikoio)
    Project: Mutation Monitor (https://github.com/umikoio/termeme)
*/

import path from "node:path"
import fs from "node:fs/promises"
import { createCanvas, loadImage } from "@napi-rs/canvas"
import terminalImage from "terminal-image"

const DEFAULTS = {
    topText: "",
    bottomText: "",
    layout: "classic",
    saveImg: false,
    stroke: 5,
    fontFamily:
        "Impact, 'Arial Black', Arial, Helvetica, sans-serif, 'Fira Code'",
    fontColor: "#ffffff",
    strokeColor: "#000000",
    noUpper: false,
    margin: 0.05,
    fontSize: 0.1,
    width: Math.max(40, Math.min(100, process.stdout?.columns || 80))
}

const withDefaults = (opts) => {
    return { ...DEFAULTS, ...opts }
}

const assumeMimeFromName = (incomingMime) => {
    // Default to PNG
    if (!incomingMime) {
        return "image/png"
    }

    // Attempt to get the file extension, return accordingly
    const ext = path.extname(incomingMime).toLowerCase()
    return ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png"
}

// Gather image buffer data before rendering to terminal
const localImageBuffer = async (filePath) => {
    const stat = await fs.stat(filePath).catch(() => null)

    if (!stat || !stat.isFile()) {
        throw new Error(`Input not found or not a file: ${filePath}`)
    }

    return fs.readFile(filePath)
}

// Small helper function to make text uppercase
// true = lowercase, false = uppercase
const toUpperMaybe = (s, noUpper) => (noUpper ? s : s.toUpperCase())

// We do our best to wrap text into lines, trying to fix maxWidth
const wrapLines = (ctx, text, maxWidth, maxLines) => {
    const words = String(text || "")
        .split(/\s+/)
        .filter(Boolean)
    const lines = []
    let current = ""
    const fits = (s) => ctx.measureText(s).width <= maxWidth

    for (const w of words) {
        const candidate = current ? current + " " + w : w

        if (fits(candidate)) {
            current = candidate
        } else {
            if (current) {
                lines.push(current)
            }

            current = w

            if (lines.length >= Math.max(1, maxLines) - 1) {
                break
            }
        }
    }

    if (current) {
        lines.push(current)
    }

    // Truncate with ellipsis if too long
    if (lines.length) {
        let last = lines[lines.length - 1]

        while (last.length > 1 && !fits(last + "...")) {
            last = last.slice(0, -1)
        }

        if (!fits(last)) {
            last = ""
        }

        if (last !== lines[lines.length - 1]) {
            lines[lines.length - 1] = last + "..."
        }
    }

    return lines
}

// Generic caption for the text block
// This includes the color, stroke data (px, color), and handles placement of the text
const drawCaption = (
    ctx,
    text,
    xCenter,
    yTop,
    lineHeightPx,
    strokePx,
    fillColor,
    strokeColor,
    rect,
    padding,
    maxLines
) => {
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    // Specific caption centered within a rectangle
    // Mainly built handle additional layouts (mainly `comparison` for now)
    if (rect) {
        const maxWidth = Math.max(0, rect.w - padding * 2)
        const wrapped = wrapLines(ctx, text, maxWidth, maxLines)
        const blockHeight = wrapped.length * lineHeightPx

        const x = rect.x + rect.w / 2
        const y = rect.y + Math.max(padding, (rect.h - blockHeight) / 2)

        for (let i = 0; i < wrapped.length; i++) {
            const line = wrapped[i]
            const yLine = y + i * lineHeightPx

            if (strokePx > 0) {
                ctx.lineWidth = strokePx
                ctx.strokeStyle = strokeColor
                ctx.strokeText(line, x, yLine)
            }

            ctx.fillStyle = fillColor
            ctx.fillText(line, x, yLine)
        }

        return y
    } else {
        const lines = text.split("\n")
        const x = xCenter
        let y = yTop

        for (const line of lines) {
            if (!line) {
                y += lineHeightPx
                continue
            }

            if (strokePx > 0) {
                ctx.lineWidth = strokePx
                ctx.strokeStyle = strokeColor
                ctx.strokeText(line, x, y)
            }

            ctx.fillStyle = fillColor
            ctx.fillText(line, x, y)
            y += lineHeightPx
        }
    }
}

// Generate a meme and return a PNG/JPG buffer
const generateMeme = async (options) => {
    const argv = withDefaults(options)

    if (!argv.input) {
        throw new Error("Missing required option: input")
    }

    const buf = await localImageBuffer(argv.input)
    const img = await loadImage(buf)
    const canvas = createCanvas(img.width, img.height)
    const ctx = canvas.getContext("2d")

    // Draw base
    ctx.drawImage(img, 0, 0)

    // Sizing
    const H = canvas.height
    const W = canvas.width
    const margin = Math.max(0, Math.min(0.2, argv.margin)) * H // px
    const baseFont = Math.max(
        12,
        Math.floor(Math.min(0.16, Math.max(0.02, argv.fontSize)) * H)
    )
    const strokePx = Math.max(
        1,
        Math.round((argv.stroke || 6) * (baseFont / 48))
    ) // scale from ~48px baseline
    const maxLines = Math.max(1, argv.maxLines)
    const boxWidth = W - margin * 2

    // Font and colors
    const fontFamily = argv.fontFamily || DEFAULTS.font.fontFamily
    const fillColor = argv.fontColor || "#FFFFFF"
    const strokeColor = argv.strokeColor || "#000000"
    ctx.font = `bold ${baseFont}px ${fontFamily}`
    const lineHeight = Math.round(baseFont * 1.1)

    if (argv.layout === "comparison") {
        // Right column rectangles (each half height)
        const colW = Math.floor(W / 2)
        const rowH = Math.floor(H / 2)

        // Slight inner padding to make it fit a bit more into a "container"
        const padding = Math.round(Math.min(colW, rowH) * 0.08)
        const rectTopRight = { x: colW, y: 0, w: W - colW, h: rowH }
        const rectBottomRight = { x: colW, y: rowH, w: W - colW, h: H - rowH }
        const topTextRaw = toUpperMaybe(argv.topText || "", argv.noUpper)
        const bottomTextRaw = toUpperMaybe(argv.bottomText || "", argv.noUpper)

        if (topTextRaw) {
            drawCaption(
                ctx,
                topTextRaw,
                null,
                null,
                lineHeight,
                strokePx,
                fillColor,
                strokeColor,
                rectTopRight,
                padding,
                maxLines
            )
        }

        if (bottomTextRaw) {
            drawCaption(
                ctx,
                bottomTextRaw,
                null,
                null,
                lineHeight,
                strokePx,
                fillColor,
                strokeColor,
                rectBottomRight,
                padding,
                maxLines
            )
        }
    } else {
        // The "classic" layout, centered top/bottomText on the image
        const topTextRaw = toUpperMaybe(argv.topText || "", argv.noUpper)
        const bottomTextRaw = toUpperMaybe(argv.bottomText || "", argv.noUpper)

        const topLines = topTextRaw
            ? wrapLines(ctx, topTextRaw, boxWidth, maxLines)
            : []
        const bottomLines = bottomTextRaw
            ? wrapLines(ctx, bottomTextRaw, boxWidth, maxLines)
            : []

        if (topLines.length) {
            drawCaption(
                ctx,
                topLines.join("\n"),
                W / 2,
                margin,
                lineHeight,
                strokePx,
                fillColor,
                strokeColor,
                null,
                null,
                null
            )
        }

        if (bottomLines.length) {
            const blockHeight = bottomLines.length * lineHeight
            drawCaption(
                ctx,
                bottomLines.join("\n"),
                W / 2,
                H - margin - blockHeight,
                lineHeight,
                strokePx,
                fillColor,
                strokeColor,
                null,
                null,
                null
            )
        }
    }

    // Export image to buffer
    const mime = assumeMimeFromName(argv.saveImg)
    const outBuffer =
        mime === "image/jpeg"
            ? canvas.toBuffer("image/jpeg", { quality: 0.92 })
            : canvas.toBuffer("image/png")
    return outBuffer
}

// Render the image in the terminal
const renderMemeToTerminal = async (inputOrOptions, width) => {
    let buf
    let w = width

    // If options are found, render with options
    // If not, just render
    if (Buffer.isBuffer(inputOrOptions)) {
        buf = inputOrOptions

        if (!w) {
            w = Math.max(40, Math.min(100, process.stdout?.columns || 80))
        }
    } else {
        const opts = withDefaults(inputOrOptions)
        buf = await generateMeme(opts)
        w = w ?? opts.width
    }

    const meme = await terminalImage.buffer(buf, {
        width: w,
        preserveAspectRatio: true
    })

    return meme
}

const TerminalMeme = async (
    arg,
    topText,
    bottomText,
    layout,
    saveImg,
    stroke,
    fontFamily,
    fontColor,
    strokeColor,
    noUpper,
    margin,
    fontSize,
    width
) => {
    // If first arg is an object, treat it as options; otherwise map positionals to options
    const opts =
        arg && typeof arg === "object" && !Buffer.isBuffer(arg)
            ? {
                  // Object
                  input: arg.input,
                  topText: arg.topText ?? DEFAULTS.topText,
                  bottomText: arg.bottomText ?? DEFAULTS.bottomText,
                  layout: arg.layout ?? DEFAULTS.layout,
                  saveImg: arg.saveImg ?? DEFAULTS.saveImg,
                  stroke: arg.stroke ?? DEFAULTS.stroke,
                  fontFamily: arg.fontFamily ?? DEFAULTS.fontFamily,
                  fontColor: arg.fontColor ?? DEFAULTS.fontColor,
                  strokeColor: arg.strokeColor ?? DEFAULTS.strokeColor,
                  noUpper: arg.noUpper ?? DEFAULTS.noUpper,
                  margin: arg.margin ?? DEFAULTS.margin,
                  fontSize: arg.fontSize ?? DEFAULTS.fontSize,
                  width: arg.width
              }
            : {
                  // Positional
                  input: a,
                  topText,
                  bottomText,
                  layout,
                  saveImg,
                  stroke,
                  fontFamily,
                  fontColor,
                  strokeColor,
                  noUpper,
                  margin,
                  fontSize,
                  width
              }

    if (!opts.input) {
        throw new Error("input image path is required")
    }

    const buf = await generateMeme(opts)
    const meme = await renderMemeToTerminal(
        buf,
        Math.max(40, Math.min(100, process.stdout?.columns || 80))
    )

    if (opts.saveImg) {
        await fs.writeFile(opts.saveImg, buf)
        return { buffer: buf, meme, saved: opts.saveImg }
    }

    return { buffer: buf, meme }
}

export { DEFAULTS, generateMeme, renderMemeToTerminal, TerminalMeme }
