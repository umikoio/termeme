#!/usr/bin/env node

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import fs from "node:fs/promises"
import { DEFAULTS, generateMeme, renderMemeToTerminal } from "./index.js"

// |--------------------------------|
//                                  |
// | Termeme Command-Line Utility   |
//                                  |
// |--------------------------------|

/*
    Author: Umiko (https://github.com/umikoio)
    Project: Termeme (https://github.com/umikoio/termeme)
*/

// Help with handling rows in the CLI (for the "multicomparison" layout)
const rowHelper = (argv) => {
    // Prefer --rows, but allow individual rows (--row, --row, etc.)
    let rows = []

    if (Array.isArray(argv.rows) && argv.rows.length) {
        rows = argv.rows.flatMap((x) =>
            typeof x === "string" ? x.split(/,(?![^[]*\])/g) : []
        )
    } else {
        rows = [argv.row1, argv.row2, argv.row3, argv.row4, argv.row5].filter(
            (x) => typeof x === "string"
        )
    }

    if (rows.length < 5) {
        rows = rows.concat(Array(5 - rows.length).fill(""))
    }

    return rows.slice(0, 5)
}

const argv = yargs(hideBin(process.argv))
    .scriptName("termeme")
    .usage("$0 -i <input> [--layout <type>] [text options] [render options]")
    .option("input", {
        alias: "i",
        type: "string",
        demandOption: true,
        describe: "Path to a local image file or layout file"
    })
    .option("topText", {
        alias: "t",
        type: "string",
        default: DEFAULTS.topText,
        describe: "Top caption text (classic/comparison)"
    })
    .option("bottomText", {
        alias: "b",
        type: "string",
        default: DEFAULTS.bottomText,
        describe: "Bottom caption text (classic/comparison)"
    })
    .option("layout", {
        alias: "l",
        type: "string",
        choices: ["classic", "comparison", "multicomparison"],
        default: DEFAULTS.layout,
        describe: "Choose the meme layout"
    })
    .option("rows", {
        type: "array",
        string: true,
        describe:
            "Text for multi-line layouts, in order (repeat --rows or comma-separate)"
    })
    .option("row1", { type: "string", describe: "Row 1 text (alt to --rows)" })
    .option("row2", { type: "string", describe: "Row 2 text" })
    .option("row3", { type: "string", describe: "Row 3 text" })
    .option("row4", { type: "string", describe: "Row 4 text" })
    .option("row5", { type: "string", describe: "Row 5 text" })
    .option("maxLines", {
        type: "number",
        default: DEFAULTS.maxLines ?? 2,
        describe: "Maximum wrapped lines per box (for all layouts)"
    })
    .option("width", {
        alias: "w",
        type: "number",
        default: DEFAULTS.width,
        describe: "Terminal render width (columns)"
    })
    .option("saveImg", {
        alias: "si",
        type: "string",
        default: DEFAULTS.saveImg,
        describe: "Export meme to a file"
    })
    .option("noUpper", {
        alias: "nu",
        type: "boolean",
        default: DEFAULTS.noUpper,
        describe: "Disable uppercase for text"
    })
    .option("margin", {
        alias: "m",
        type: "number",
        default: DEFAULTS.margin,
        describe:
            "Outer margin as a fraction of image height (0-0.2) (Default 0.05)"
    })
    .option("stroke", {
        alias: "s",
        type: "number",
        default: DEFAULTS.stroke,
        describe: "Outline thickness in pixels (scales with font)"
    })
    .option("fontSize", {
        alias: "fs",
        type: "number",
        default: DEFAULTS.fontSize,
        describe:
            "Base font size as a fraction of image height (0.02-0.16) (Default 0.1)"
    })
    .option("fontFamily", {
        alias: "ff",
        type: "string",
        default: DEFAULTS.fontFamily,
        describe: "Font family used for text"
    })
    .option("fontColor", {
        alias: "fc",
        type: "string",
        default: DEFAULTS.fontColor,
        describe: "Text fill color (hexadecimal)"
    })
    .option("strokeColor", {
        alias: "sc",
        type: "string",
        default: DEFAULTS.strokeColor,
        describe: "Text outline color (hexadecimal)"
    })
    .help().argv

;(async () => {
    try {
        const opts =
            argv.layout === "multicomparison"
                ? { ...argv, rows: rowHelper(argv) }
                : argv

        const buf = await generateMeme(opts)
        const meme = await renderMemeToTerminal(buf, argv.width)
        console.log(meme)

        if (argv.saveImg) {
            await fs.writeFile(argv.saveImg, buf)
            console.error(`\nSaved image to: ${argv.saveImg}`)
        }
    } catch (err) {
        console.error("Error:", err?.message || err)
        process.exitCode = 1
    }
})()
