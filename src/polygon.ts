import { Input } from "./index.js"
import Vector2 from "./vector2.js"

export default class Polygon {
    public selected = false

    public static regular(position: Vector2, sides: number, radius: number): Polygon {
        const vertices = Array(sides).fill(0)
            .map((_, index) => 2 * Math.PI * index / sides)
            .map(angle => Vector2.fromAngle(angle).multiply(radius))

        return new Polygon(
            vertices,
            position,
        )
    }

    public constructor(public vertices: Vector2[], public position: Vector2) {}

    public update(deltaTime: number, input: Input) {
        if (!this.selected) {
            return
        }

        let velocity = new Vector2(0, 0)
        if (input["ArrowRight"] === "down") {
            velocity.x += 1
        }
        if (input["ArrowUp"] === "down") {
            velocity.y += 1
        }
        if (input["ArrowLeft"] === "down") {
            velocity.x -= 1
        }
        if (input["ArrowDown"] === "down") {
            velocity.y -= 1
        }

        velocity = velocity.normalize().multiply(3 * deltaTime)

        this.position = this.position.addVector(velocity)
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

    public support(direction: Vector2): Vector2 {
        const [_, closestVertex] = this.vertices.reduce<[number, Vector2]>((best, vertex) => {
            const current = direction.dot(vertex)
            if (current > best[0]) {
                return [current, vertex]
            } else {
                return best
            }
        }, [-Infinity, Vector2.zero()])

        return closestVertex.addVector(this.position)
    }
}
