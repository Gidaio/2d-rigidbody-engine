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

    const [collided, simplex] = gjk()
    let polytope
    let normals
    let penetrationVector
    if (collided) {
        [polytope, normals, penetrationVector] = epa(polygonA, polygonB, simplex)
    }

    render(collided, simplex, polytope, normals, penetrationVector)

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

function gjk(): [boolean, Vector2[]] {
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

function epa(a: Polygon, b: Polygon, startingSimplex: Vector2[]): [Vector2[], Vector2[], Vector2] {
    const polytope = [...startingSimplex].sort((a, b) => a.angle() - b.angle())

    while (true) {
        const normals = []

        let closestDirection: Vector2 = Vector2.zero()
        let closestIndex: number = -1
        let closestDistance = Infinity
        for (let i = 0; i < polytope.length; i++) {
            const currentVertex = polytope[i]
            const previousVertex = polytope[wrap(i - 1, 0, polytope.length)]
            const nextVertex = polytope[wrap(i + 1, 0, polytope.length)]
            const prevCurr = previousVertex.subtractVector(currentVertex)
            const currNext = nextVertex.subtractVector(currentVertex)
            const normal = Vector2.tripleProduct(prevCurr, currNext, currNext).normalize()

            const distance = currentVertex.dot(normal)
            if (distance < closestDistance) {
                closestDistance = distance
                closestIndex = i
                closestDirection = normal
            }

            normals.push(normal.multiply(distance))
        }

        const newVertex = a.support(closestDirection).subtractVector(b.support(closestDirection.negate()))
        if (polytope.some(vertex => vertex.equals(newVertex))) {
            return [polytope, normals, closestDirection.multiply(closestDistance)]
        } else {
            polytope.splice(closestIndex + 1, 0, newVertex)
        }
    }
}

function render(collided: boolean, simplex: Vector2[], polytope?: Vector2[], normals?: Vector2[], penetrationVector?: Vector2) {
    context.fillStyle = "#EEEEEE"
    context.fillRect(0, 0, canvas.width, canvas.height)

    if (collided) {
        drawShape(polytope!, "#FFFF00", true)

        context.strokeStyle = "#FF00FF"
        context.beginPath()
        for (const normal of normals!) {
            context.moveTo(canvas.width / 2, canvas.height / 2)
            context.lineTo(...worldToCanvas(normal).coords)
        }
        context.stroke()
    }

    drawShape(simplex, collided ? "#00FF00" : "#0000FF", true)

    context.fillStyle = "#000000"
    context.beginPath()
    context.moveTo(canvas.width / 2, canvas.height / 2)
    context.ellipse(canvas.width / 2, canvas.height / 2, 3, 3, 0, 0, 2 * Math.PI)
    context.fill()

    context.font = "16px sans-serif"
    context.fillStyle = "#000000"

    if (penetrationVector) {
        context.fillText(`Penetration vector: (${penetrationVector.x},${penetrationVector.y})`, 5, 21)
    }

    drawPolygon(polygonA)
    drawPolygon(polygonB)
}

function drawPolygon(polygon: Polygon) {
    const worldVertices = polygon.vertices.map(vertex => vertex.rotate(polygon.angle).addVector(polygon.position))
    drawShape(worldVertices, polygon.selected ? "#FF0000" : "#000000")
}

function drawShape(shape: Vector2[], color: string, includeVertices = false) {
    const canvasVertices = shape.map(vertex => worldToCanvas(vertex))

    context.strokeStyle = context.fillStyle = color
    context.beginPath()
    context.moveTo(...canvasVertices[0].coords)

    for (const vertex of canvasVertices.slice(1)) {
        context.lineTo(...vertex.coords)
    }

    context.closePath()
    context.stroke()

    if (includeVertices) {
        context.beginPath()
        for (const vertex of canvasVertices) {
            context.moveTo(...vertex.coords)
            context.ellipse(vertex.x, vertex.y, 3, 3, 0, 0, 2 * Math.PI)
        }
        context.fill()
    }
}

function worldToCanvas(vector: Vector2): Vector2 {
    // Converts from a space that goes from -5 to 5 to one that goes from 0 to canvas width/height.
    const offset = 5
    const scale = canvas.width / 10
    const canvasVector = vector.addScalar(offset).multiply(scale)
    canvasVector.y = canvas.height - canvasVector.y

    return canvasVector
}

function wrap(value: number, min: number, max: number): number {
    const interval = max - min

    if (value < min) {
        return value + interval
    } else if (value >= max) {
        return value - interval
    } else {
        return value
    }
}
