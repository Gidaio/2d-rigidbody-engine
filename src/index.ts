import Polygon from "./polygon.js"
import Vector2 from "./vector2.js"

export type Input = { [key: string]: "pressed" | "down" | "released" | "up" }
export type Collision = {
    referencePolygon: Polygon,
    incidentPolygon: Polygon,
    flipped: boolean,
    contactPoint: Vector2,
}
export type Edge = { start: Vector2, end: Vector2, normal: Vector2}

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

    const gjkSimplex = gjk()
    let collisionInfo
    if (gjkSimplex) {
        const penetrationVector = epa(polygonA, polygonB, gjkSimplex)
        collisionInfo = contactPoints(polygonA, polygonB, penetrationVector)
        const halfPenetrationVector = penetrationVector.multiply(0.5)
        polygonA.position = polygonA.position.subtractVector(halfPenetrationVector)
        polygonB.position = polygonB.position.addVector(halfPenetrationVector)

        if (collisionInfo) {
            if (collisionInfo.flipped) {
                collisionInfo.contactPoint = collisionInfo.contactPoint.subtractVector(halfPenetrationVector)
            } else {
                collisionInfo.contactPoint = collisionInfo.contactPoint.addVector(halfPenetrationVector)
            }
        }
    }

    render(collisionInfo)

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

function gjk(): Vector2[] | null {
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
        return null
    }

    simplex.push(potentialSupportPoint)

    const ab = simplex[0].subtractVector(simplex[1])
    const ao = Vector2.zero().subtractVector(simplex[1])
    supportDirection = Vector2.tripleProduct(ab, ao, ab).normalize()
    potentialSupportPoint = polygonA.support(supportDirection)
        .subtractVector(polygonB.support(supportDirection.negate()))

    if (potentialSupportPoint.dot(supportDirection) < 0) {
        return null
    }

    simplex.push(potentialSupportPoint)

    for (let iterations = 0; iterations < 10; iterations++) {
        const ao = Vector2.zero().subtractVector(simplex[2])
        const ab = simplex[1].subtractVector(simplex[2])
        const ac = simplex[0].subtractVector(simplex[2])
        const abNormal = Vector2.tripleProduct(ac, ab, ab).normalize()
        const acNormal = Vector2.tripleProduct(ab, ac, ac).normalize()
        const abDot = abNormal.dot(ao)
        const acDot = acNormal.dot(ao)
        if (abDot <= 0 && acDot <= 0) {
            return simplex
        } else if (abDot > 0) {
            potentialSupportPoint = polygonA.support(abNormal)
                .subtractVector(polygonB.support(abNormal.negate()))

            if (potentialSupportPoint.dot(abNormal) < 0) {
                return null
            }

            simplex = [simplex[1], simplex[2], potentialSupportPoint]
        } else if (acDot > 0) {
            potentialSupportPoint = polygonA.support(acNormal)
                .subtractVector(polygonB.support(acNormal.negate()))

            if (potentialSupportPoint.dot(acNormal) < 0) {
                return null
            }

            simplex = [simplex[0], simplex[2], potentialSupportPoint]
        } else {
            throw new Error("I should never have gotten here.")
        }
    }

    console.warn("Too many GJK iterations!")
    return null
}

function epa(a: Polygon, b: Polygon, startingSimplex: Vector2[]): Vector2 {
    const polytope = [...startingSimplex].sort((a, b) => a.angle() - b.angle())

    for (let iterations = 0; iterations < 10; iterations++) {
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
            return closestDirection.multiply(closestDistance)
        } else {
            polytope.splice(closestIndex + 1, 0, newVertex)
        }
    }

    console.warn("Too many EPA iterations!")

    return Vector2.zero()
}

function contactPoints(a: Polygon, b: Polygon, penetrationVector: Vector2): Collision | null {
    const penetrationNormal = penetrationVector.normalize()
    const contactEdgeA = getContactEdge(a, penetrationNormal)
    const contactEdgeB = getContactEdge(b, penetrationNormal.negate())

    if (!contactEdgeA || !contactEdgeB) {
        return null
    }

    let referenceEdge
    let referencePolygon
    let incidentEdge
    let incidentPolygon
    let flipped

    if (
        Math.abs(contactEdgeA.end.subtractVector(contactEdgeA.start).dot(penetrationNormal))
        <= Math.abs(contactEdgeB.end.subtractVector(contactEdgeB.start).dot(penetrationNormal))
    ) {
        referenceEdge = contactEdgeA
        referencePolygon = a
        incidentEdge = contactEdgeB
        incidentPolygon = b
        flipped = false
    } else {
        referenceEdge = contactEdgeB
        referencePolygon = b
        incidentEdge = contactEdgeA
        incidentPolygon = a
        flipped = true
    }

    const incidentStart = incidentEdge.start.normalize().dot(referenceEdge.normal)
    const incidentEnd = incidentEdge.end.normalize().dot(referenceEdge.normal)

    if (incidentStart <= incidentEnd) {
        return {
            referencePolygon,
            incidentPolygon,
            contactPoint: incidentEdge.start.addVector(incidentPolygon.position),
            flipped,
        }
    } else {
        return {
            referencePolygon,
            incidentPolygon,
            contactPoint: incidentEdge.end.addVector(incidentPolygon.position),
            flipped,
        }
    }

    function getContactEdge(polygon: Polygon, direction: Vector2): Edge | null {
        let maxProjection = 0
        let index = -1
        for (let i = 0; i < polygon.vertices.length; i++) {
            const vertex = polygon.vertices[i].rotate(polygon.angle)
            const projection = direction.dot(vertex)
            if (projection > maxProjection) {
                maxProjection = projection
                index = i
            }
        }

        if (index === -1) {
            return null
        }

        const currentVertex = polygon.vertices[index].rotate(polygon.angle)
        const previousIndex = wrap(index - 1, 0, polygon.vertices.length)
        const previousVertex = polygon.vertices[previousIndex].rotate(polygon.angle)
        const nextIndex = wrap(index + 1, 0, polygon.vertices.length)
        const nextVertex = polygon.vertices[nextIndex].rotate(polygon.angle)
        const rightEdge = currentVertex.subtractVector(previousVertex).normalize()
        const leftEdge = currentVertex.subtractVector(nextVertex).normalize()

        if (rightEdge.dot(direction) <= leftEdge.dot(direction)) {
            return {
                start: previousVertex,
                end: currentVertex,
                normal: Vector2.tripleProduct(rightEdge, leftEdge, rightEdge).normalize(),
            }
        } else {
            return {
                start: currentVertex,
                end: nextVertex,
                normal: Vector2.tripleProduct(leftEdge, rightEdge, leftEdge).normalize(),
            }
        }
    }
}

function render(collisionInfo?: Collision | null) {
    context.fillStyle = "#EEEEEE"
    context.fillRect(0, 0, canvas.width, canvas.height)

    drawPolygon(polygonA)
    drawPolygon(polygonB)

    if (collisionInfo) {
        context.fillStyle = "#0000FF"
        const canvasContactPoint = worldToCanvas(collisionInfo.contactPoint)
        context.beginPath()
        context.ellipse(canvasContactPoint.x, canvasContactPoint.y, 3, 3, 0, 0, Math.PI * 2)
        context.fill()
    }
}

function drawPolygon(polygon: Polygon) {
    const worldVertices = polygon.vertices.map(vertex => vertex.rotate(polygon.angle).addVector(polygon.position))
    drawShape(worldVertices, polygon.selected ? "#FF0000" : "#000000")
}

function drawShape(shape: Vector2[], color: string, includeVertices = false) {
    const canvasVertices = shape.map(vertex => worldToCanvas(vertex))

    context.strokeStyle = context.fillStyle = color
    context.lineWidth = 1
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
