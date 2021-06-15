import Vector2 from "./vector2.js"

export default class Polygon {
    public constructor(public vertices: Vector2[], public position: Vector2, public velocity: Vector2, public angularVelocity: number) {}

    public static regular(position: Vector2, sides: number, radius: number): Polygon {
        const vertices = Array(sides).fill(0)
            .map((_, index) => 2 * Math.PI * index / sides)
            .map(angle => new Vector2(Math.cos(angle), Math.sin(angle)).multiply(radius))

        return new Polygon(
            vertices,
            position,
            Vector2.zero(),
            0,
        )
    }

    public setDirectionAndSpeed(direction: number, speed: number) {
        this.velocity = new Vector2(Math.cos(direction), Math.sin(direction)).multiply(speed)
    }

    public update(deltaTime: number) {
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

    public support(vector: Vector2): Vector2 {
        let [_, closestVertex] = this.vertices.reduce<[number, Vector2]>((best, vertex) => {
            const current = vector.dot(vertex)
            if (current > best[0]) {
                return [current, vertex]
            } else {
                return best
            }
        }, [-Infinity, Vector2.zero()])

        return closestVertex
    }
}
