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

const argv = yargs(hideBin(process.argv))
    .scriptName("termeme")
    .usage("$0 -i <input> [-t <topText>] [-b <bottomText>] [options]")
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
        describe: "Top caption text"
    })
    .option("bottomText", {
        alias: "b",
        type: "string",
        default: DEFAULTS.bottomText,
        describe: "Bottom caption text"
    })
    .option("layout", {
        alias: "l",
        type: "string",
        choices: ["classic", "comparison"],
        default: DEFAULTS.layout,
        describe: "Choose which type of meme layout you want"
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
        describe: "Test outline color (hexadecimal)"
    })
    .help().argv

;(async () => {
    try {
        const buf = await generateMeme(argv)
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
