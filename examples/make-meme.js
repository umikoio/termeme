import TerminalMeme from "../index.js"

const { meme } = await TerminalMeme({
    input: "layouts/WojackTemplate.jpg",
    topText: "Generating memes!",
    bottomText: "It's not in a terminal...",
    layout: "comparison",
    saveImg: "wojackmeme_termeme.jpg",
    stroke: 4,
    fontfamily: "Fira Code, Arial",
    fontColor: "#FFFFFF",
    strokecolor: "#000000",
    fontSize: 0.05
})

console.log(meme)
