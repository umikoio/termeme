import TerminalMeme from "../index.js"

const { meme } = await TerminalMeme({
    input: "./templates/WojackTemplate.jpg",
    top: "Generating memes!",
    bottom: "It's not in a terminal...",
    template: "comparison",
    save: "wojackmeme_termeme.jpg",
    stroke: 4,
    fontfamily: "Fira Code, Arial",
    color: "#FFFFFF",
    strokecolor: "#000000",
    fontScale: 0.05
})

console.log(meme)
