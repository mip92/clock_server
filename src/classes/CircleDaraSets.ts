export interface CircleDataSetInterface {
    label: string,
    data: number[],
}

export class CircleDataSet implements CircleDataSetInterface {
    data: number[];
    label: string;

    constructor(label: string, length:number) {
        this.label = label
        const arr= Array.from({length}, (v, k) => k);
        this.data = []
    }

    setData(orders: number) {
        this.data = [...this.data, orders]
    }
}