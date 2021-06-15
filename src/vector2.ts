export default class Vector2 {
    public get coords(): [number, number] {
        return [this.x, this.y]
    }

    public constructor(public x: number, public y: number) {}

    public addScalar(scalar: number): Vector2 {
        return new Vector2(this.x + scalar, this.y + scalar)
    }

    public addVector(vector: Vector2): Vector2 {
        return new Vector2(this.x + vector.x, this.y + vector.y)
    }

    public multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar)
    }
}
