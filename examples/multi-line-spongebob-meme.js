import { TerminalMeme } from "../index.js"

const { meme } = await TerminalMeme({
    input: "layouts/SpongebobFiveTemplate.jpg",
    rows: [
        "Intern",
        "1x Engineer",
        "5x Engineer",
        "10x Engineer",
        "Unemployed"
    ],
    layout: "multicomparison",
    saveImg: "spongebob_five_termeme.jpg",
    stroke: 4,
    fontfamily: "Fira Code, Arial",
    fontColor: "#FFFFFF",
    strokecolor: "#000000",
    fontSize: 0.03
})

console.log(meme)
