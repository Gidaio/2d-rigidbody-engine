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

    for (let a = 0; a < polygons.length - 1; a++) {
        for (let b = a + 1; b < polygons.length; b++) {
            if (polygons[a].collides(polygons[b])) {
                polygons[a].color = "#FF0000"
                polygons[b].color = "#00FF00"
            }
        }
    }

    render()

    requestAnimationFrame(doFrame)
}

function render() {
    context.fillStyle = "#FFFFFF"
    context.fillRect(0, 0, canvas.width, canvas.height)
    polygons.forEach(drawPolygon)
}

function drawPolygon(polygon: Polygon) {
    const canvasVertices = polygon.vertices.map(vertex => worldToCanvas(vertex.addVector(polygon.position)))

    context.strokeStyle = polygon.color
    context.beginPath()
    context.moveTo(...canvasVertices[0].coords)

    for (const vertex of canvasVertices.slice(1)) {
        context.lineTo(...vertex.coords)
    }

    context.closePath()
    context.stroke()
}

function worldToCanvas(vector: Vector2): Vector2 {
    // Converts from a space that goes from -5 to 5 to one that goes from 0 to canvas width/height.
    const offset = 5
    const scale = canvas.width / 10
    const canvasVector = vector.addScalar(offset).multiply(scale)
    canvasVector.y = canvas.height - canvasVector.y
    
    return canvasVector
}
