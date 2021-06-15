import Vector2 from "./vector2.js"

type Polygon = {
    vertices: Vector2[],
    position: Vector2,
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!

const polygons: Polygon[] = [
    regularPolygon(new Vector2(0, 0), 6, 1),
    regularPolygon(new Vector2(1, 1), 3, 0.5),
    regularPolygon(new Vector2(2, -1), 9, 3),
    regularPolygon(new Vector2(-4, 0), 5, 1.25),
]

render()

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

function regularPolygon(position: Vector2, sides: number, radius: number): Polygon {
    const vertices = Array(sides).fill(0)
        .map((_, index) => 2 * Math.PI * index / sides)
        .map(angle => new Vector2(Math.cos(angle), Math.sin(angle)).multiply(radius))

    return {
        vertices,
        position,
    }
}
