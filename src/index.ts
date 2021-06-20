import Polygon from "./polygon.js"
import Vector2 from "./vector2.js"

export type Input = { [key: string]: "pressed" | "down" | "released" | "up" }

const canvas = document.getElementById("canvas") as HTMLCanvasElement
const context = canvas.getContext("2d")!

let lastTime = performance.now()
const rawInput: { [key: string]: boolean } = {}
const input: Input = {}

const polygonA = Polygon.regular(new Vector2(-2, 0), 6, 1)
const polygonB = Polygon.regular(new Vector2(2, 0), 3, 1)
polygonA.selected = true

document.addEventListener("keydown", event => {
    rawInput[event.key] = true
})

document.addEventListener("keyup", event => {
    rawInput[event.key] = false
})

requestAnimationFrame(loop)

function loop(now: DOMHighResTimeStamp) {
    const deltaTime = (now - lastTime) / 1000
    lastTime = now

    processInput()

    if (input[" "] === "pressed") {
        polygonA.selected = !polygonA.selected
        polygonB.selected = !polygonB.selected
    }

    polygonA.update(deltaTime, input)
    polygonB.update(deltaTime, input)

    const [collided, simplex] = collision()

    render(collided, simplex)

    requestAnimationFrame(loop)
}

function processInput() {
    Object.keys(rawInput).forEach(key => {
        const keyPressed = rawInput[key]
        if (keyPressed) {
            if (input[key] === "pressed" || input[key] === "down") {
                input[key] = "down"
            } else {
                input[key] = "pressed"
            }
        } else {
            if (input[key] === "released" || input[key] === "up") {
                input[key] = "up"
            } else {
                input[key] = "released"
            }
        }
    })
}

function collision(): [boolean, Vector2[]] {
    // This is GJK!
    let simplex: Vector2[] = []
    let supportDirection = polygonB.position.subtractVector(polygonA.position).normalize()
    let aSupport = polygonA.support(supportDirection)
    let bSupport = polygonB.support(supportDirection.negate())
    simplex.push(aSupport.subtractVector(bSupport))

    supportDirection = Vector2.zero().subtractVector(simplex[0]).normalize()
    aSupport = polygonA.support(supportDirection)
    bSupport = polygonB.support(supportDirection.negate())
    let potentialSupportPoint = aSupport.subtractVector(bSupport)

    if (potentialSupportPoint.dot(supportDirection) < 0) {
        return [false, simplex]
    }

    simplex.push(potentialSupportPoint)

    const ab = simplex[0].subtractVector(simplex[1])
    const ao = Vector2.zero().subtractVector(simplex[1])
    supportDirection = Vector2.tripleProduct(ab, ao, ab).normalize()
    potentialSupportPoint = polygonA.support(supportDirection)
        .subtractVector(polygonB.support(supportDirection.negate()))

    if (potentialSupportPoint.dot(supportDirection) < 0) {
        return [false, simplex]
    }

    simplex.push(potentialSupportPoint)

    while (true) {
        const ao = Vector2.zero().subtractVector(simplex[2])
        const ab = simplex[1].subtractVector(simplex[2])
        const ac = simplex[0].subtractVector(simplex[2])
        const abNormal = Vector2.tripleProduct(ac, ab, ab).normalize()
        const acNormal = Vector2.tripleProduct(ab, ac, ac).normalize()
        const abDot = abNormal.dot(ao)
        const acDot = acNormal.dot(ao)
        if (abDot < 0 && acDot < 0) {
            return [true, simplex]
        } else if (abDot > 0) {
            potentialSupportPoint = polygonA.support(abNormal)
                .subtractVector(polygonB.support(abNormal.negate()))

            if (potentialSupportPoint.dot(abNormal) < 0) {
                return [false, simplex]
            }

            simplex = [simplex[1], simplex[2], potentialSupportPoint]
        } else if (acDot > 0) {
            potentialSupportPoint = polygonA.support(acNormal)
                .subtractVector(polygonB.support(acNormal.negate()))

            if (potentialSupportPoint.dot(acNormal) < 0) {
                return [false, simplex]
            }

            simplex = [simplex[0], simplex[2], potentialSupportPoint]
        } else {
            throw new Error("I should never have gotten here.")
        }
    }
}

function render(collided: boolean, simplex: Vector2[]) {
    context.fillStyle = "#EEEEEE"
    context.fillRect(0, 0, canvas.width, canvas.height)
    drawPolygon(polygonA)
    drawPolygon(polygonB)

    const canvasSimplex = simplex.map(vertex => worldToCanvas(vertex))
    context.strokeStyle = context.fillStyle = collided ? "#00FF00" : "#0000FF"
    context.beginPath()
    context.moveTo(...canvasSimplex[0].coords)
    for (const vertex of canvasSimplex.slice(1)) {
        context.lineTo(...vertex.coords)
    }
    context.closePath()
    context.stroke()
    context.beginPath()
    for (const vertex of canvasSimplex) {
        context.moveTo(...vertex.coords)
        context.ellipse(vertex.x, vertex.y, 3, 3, 0, 0, 2 * Math.PI)
    }
    context.fill()

    context.fillStyle = "#000000"
    context.beginPath()
    context.moveTo(canvas.width / 2, canvas.height / 2)
    context.ellipse(canvas.width / 2, canvas.height / 2, 3, 3, 0, 0, 2 * Math.PI)
    context.fill()
}

function drawPolygon(polygon: Polygon) {
    const canvasVertices = polygon.vertices.map(vertex => worldToCanvas(vertex.addVector(polygon.position)))

    context.strokeStyle = polygon.selected ? "#FF0000" : "#000000"
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
