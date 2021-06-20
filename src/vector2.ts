export default class Vector2 {
    public get coords(): [number, number] {
        return [this.x, this.y]
    }

    public static zero(): Vector2 {
        return new Vector2(0, 0)
    }

    public static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle))
    }

    public static tripleProduct(a: Vector2, b: Vector2, c: Vector2): Vector2 {
        // Equivalent to (A x B) x C
        const aCrossB = a.x * b.y - a.y * b.x
        return new Vector2(
            -aCrossB * c.y,
            aCrossB * c.x,
        )
    }

    public constructor(public x: number, public y: number) {}

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y)
    }

    public normalize(): Vector2 {
        const magnitude = this.magnitude()
        return magnitude === 0 ? Vector2.zero() : new Vector2(this.x / magnitude, this.y / magnitude)
    }

    public negate(): Vector2 {
        return new Vector2(-this.x, -this.y)
    }

    public rotate(angle: number): Vector2 {
        return new Vector2(
            this.x * Math.cos(angle) - this.y * Math.sin(angle),
            this.x * Math.sin(angle) + this.y * Math.cos(angle),
        )
    }

    public angle(): number {
        let angle = Math.atan2(this.y, this.x)
        if (angle < 0) {
            angle += 2 * Math.PI
        }

        return angle
    }

    public addScalar(scalar: number): Vector2 {
        return new Vector2(this.x + scalar, this.y + scalar)
    }

    public addVector(vector: Vector2): Vector2 {
        return new Vector2(this.x + vector.x, this.y + vector.y)
    }

    public subtractVector(vector: Vector2): Vector2 {
        return new Vector2(this.x - vector.x, this.y - vector.y)
    }

    public multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar)
    }

    public dot(vector: Vector2): number {
        return this.x * vector.x + this.y * vector.y
    }
}
