import Polygon from "./polygon.js"
import Vector2 from "./vector2.js"

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!
let lastTime = performance.now()
let supportAngle = 0

const keys = {
    left: false,
    right: false,
}

document.addEventListener("keydown", event => {
    switch (event.key) {
        case "ArrowLeft":
            keys.left = true
            break

        case "ArrowRight":
            keys.right = true
            break
    }
})

document.addEventListener("keyup", event => {
    switch (event.key) {
        case "ArrowLeft":
            keys.left = false
            break

        case "ArrowRight":
            keys.right = false
            break
    }
})

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
    if (keys.left) {
        supportAngle += deltaTime * 2
    }

    if (keys.right) {
        supportAngle -= deltaTime * 2
    }

    render()

    requestAnimationFrame(doFrame)
}

function render() {
    const supportVector = new Vector2(Math.cos(supportAngle), Math.sin(supportAngle))

    context.fillStyle = "#FFFFFF"
    context.fillRect(0, 0, canvas.width, canvas.height)
    polygons.forEach(polygon => drawPolygon(polygon, supportVector))

    const renderSupportVector = supportVector.multiply(50)

    context.strokeStyle = "#FF0000"
    context.beginPath()
    context.moveTo(canvas.width / 2, canvas.height / 2)
    context.lineTo(canvas.width / 2 + renderSupportVector.x, canvas.height / 2 - renderSupportVector.y)
    context.stroke()
}

function drawPolygon(polygon: Polygon, supportVector: Vector2) {
    const canvasVertices = polygon.vertices.map(vertex => worldToCanvas(vertex.addVector(polygon.position)))

    context.strokeStyle = "#000000"
    context.beginPath()
    context.moveTo(...canvasVertices[0].coords)

    for (const vertex of canvasVertices.slice(1)) {
        context.lineTo(...vertex.coords)
    }

    context.closePath()
    context.stroke()

    const supportVertex = worldToCanvas(polygon.support(supportVector).addVector(polygon.position))

    context.fillStyle = "#FF0000"
    context.beginPath()
    context.ellipse(supportVertex.x, supportVertex.y, 10, 10, 0, 0, 2 * Math.PI)
    context.fill()
}

function worldToCanvas(vector: Vector2): Vector2 {
    // Converts from a space that goes from -5 to 5 to one that goes from 0 to canvas width/height.
    const offset = 5
    const scale = canvas.width / 10
    const canvasVector = vector.addScalar(offset).multiply(scale)
    canvasVector.y = canvas.height - canvasVector.y
    
    return canvasVector
}
