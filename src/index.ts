type Vector2 = {
    x: number,
    y: number,
}

type Polygon = {
    vertices: Vector2[],
    position: Vector2,
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!

const polygons: Polygon[] = [
    regularPolygon({ x: 0, y: 0 }, 6, 1),
    regularPolygon({ x: 1, y: 1 }, 3, 0.5),
    regularPolygon({ x: 2, y: -1 }, 9, 3),
    regularPolygon({ x: -4, y: 0 }, 5, 1.25),
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

    const canvasVertices = polygon.vertices.map(relativeVertex => {
        const absoluteVertex: Vector2 = {
            x: relativeVertex.x + polygon.position.x,
            y: relativeVertex.y + polygon.position.y,
        }

        const canvasVertex: Vector2 = {
            x: (absoluteVertex.x + offset) * scale,
            y: canvas.height - (absoluteVertex.y + offset) * scale,
        }

        return canvasVertex
    })

    context.strokeStyle = "#000000"
    context.beginPath()
    context.moveTo(canvasVertices[0].x, canvasVertices[0].y)

    for (const vertex of canvasVertices.slice(1)) {
        context.lineTo(vertex.x, vertex.y)
    }

    context.closePath()
    context.stroke()
}

function regularPolygon(position: Vector2, sides: number, radius: number): Polygon {
    const vertices = Array(sides).fill(0)
        .map((_, index) => 2 * Math.PI * index / sides)
        .map<Vector2>(angle => ({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }))

    return {
        vertices,
        position,
    }
}
