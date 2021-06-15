import Vector2 from "./vector2.js"

export default class Polygon {
    public color: string = "#000000"

    public constructor(public vertices: Vector2[], public position: Vector2, public velocity: Vector2, public angularVelocity: number) {}

    public static regular(position: Vector2, sides: number, radius: number): Polygon {
        const vertices = Array(sides).fill(0)
            .map((_, index) => 2 * Math.PI * index / sides)
            .map(angle => Vector2.fromDirection(angle).multiply(radius))

        return new Polygon(
            vertices,
            position,
            Vector2.zero(),
            0,
        )
    }

    public setDirectionAndSpeed(direction: number, speed: number) {
        this.velocity = Vector2.fromDirection(direction).multiply(speed)
    }

    public update(deltaTime: number) {
        this.color = "#000000"
        this.position = this.position.addVector(this.velocity.multiply(deltaTime))
        if (this.position.x > 5) {
            this.position.x -= 10
        } else if (this.position.x < -5) {
            this.position.x += 10
        }

        if (this.position.y > 5) {
            this.position.y -= 10
        } else if (this.position.y < -5) {
            this.position.y += 10
        }
    }

    public collides(polygon: Polygon): boolean {
        // This is GJK!
        let simplex: Vector2[] = []
        let supportDirection = polygon.position.subtractVector(this.position).normalize()
        let aSupport = this.support(supportDirection)
        let bSupport = polygon.support(supportDirection.negate())
        simplex.push(aSupport.subtractVector(bSupport))

        supportDirection = Vector2.zero().subtractVector(simplex[0]).normalize()
        aSupport = this.support(supportDirection)
        bSupport = polygon.support(supportDirection.negate())
        let potentialSupportPoint = aSupport.subtractVector(bSupport)

        if (potentialSupportPoint.dot(supportDirection) < 0) {
            return false
        }

        simplex.push(potentialSupportPoint)

        const ab = simplex[0].subtractVector(simplex[1])
        const ao = Vector2.zero().subtractVector(simplex[1])
        supportDirection = Vector2.tripleProduct(ab, ao, ab).normalize()
        potentialSupportPoint = this.support(supportDirection)
            .subtractVector(polygon.support(supportDirection.negate()))

        if (potentialSupportPoint.dot(supportDirection) < 0) {
            return false
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
                return true
            } else if (abDot > 0) {
                potentialSupportPoint = this.support(abNormal)
                    .subtractVector(polygon.support(abNormal.negate()))
                
                if (potentialSupportPoint.dot(abNormal) < 0) {
                    return false
                }

                simplex = [simplex[1], simplex[2], potentialSupportPoint]
            } else if (acDot > 0) {
                potentialSupportPoint = this.support(acNormal)
                    .subtractVector(polygon.support(acNormal.negate()))

                if (potentialSupportPoint.dot(acNormal) < 0) {
                    return false
                }

                simplex = [simplex[0], simplex[2], potentialSupportPoint]
            } else {
                throw new Error("I should never have gotten here.")
            }
        }
    }

    public support(vector: Vector2): Vector2 {
        let [_, closestVertex] = this.vertices.reduce<[number, Vector2]>((best, vertex) => {
            const current = vector.dot(vertex)
            if (current > best[0]) {
                return [current, vertex]
            } else {
                return best
            }
        }, [-Infinity, Vector2.zero()])

        return closestVertex.addVector(this.position)
    }
}

function removeDuplicateVertices(vertices: Vector2[]): Vector2[] {
    const deduped: Vector2[] = [vertices[0]]

    for (const vertex of vertices.slice(1)) {
        const lastVertex = deduped[deduped.length - 1]
        if (vertex.x != lastVertex.x || vertex.y != vertex.y) {
            deduped.push(vertex)
        }
    }

    return deduped
}
