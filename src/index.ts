import Polygon from "./polygon.js"
import Vector2 from "./vector2.js"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!
let lastTime = performance.now()

const polygons: Polygon[] = [
    Polygon.regular(new Vector2(0, 0), 6, 1),
    Polygon.regular(new Vector2(1, 1), 3, 0.5),
    Polygon.regular(new Vector2(2, -1), 9, 3),
    Polygon.regular(new Vector2(-4, 0), 5, 1.25),
]

polygons[0].setDirectionAndSpeed(Math.PI / 4, 1)
polygons[1].setDirectionAndSpeed(2 * Math.PI / 3, 1.5)
polygons[2].setDirectionAndSpeed(3 * Math.PI / 2, 0.25)

requestAnimationFrame(doFrame)

function doFrame(now: DOMHighResTimeStamp) {
    const deltaTime = (now - lastTime) / 1000
    lastTime = now

    polygons.forEach(polygon => polygon.update(deltaTime))
    render()

    requestAnimationFrame(doFrame)
}

function render() {
    context.fillStyle = "#FFFFFF"
    context.fillRect(0, 0, canvas.width, canvas.height)
    polygons.forEach(drawPolygon)
}

function drawPolygon(polygon: Polygon) {
    // Converts from a space that goes from -5 to 5 to one that goes from 0 to canvas width/height.
    const offset = 5
    const scale = canvas.width / 10

    const canvasVertices = polygon.vertices.map(vertex => {
        const transformedVertex = vertex.addVector(polygon.position).addScalar(offset).multiply(scale)
        transformedVertex.y = canvas.height - transformedVertex.y
        return transformedVertex
    })

    context.strokeStyle = "#000000"
    context.beginPath()
    context.moveTo(...canvasVertices[0].coords)

    for (const vertex of canvasVertices.slice(1)) {
        context.lineTo(...vertex.coords)
    }

    context.closePath()
    context.stroke()
}
