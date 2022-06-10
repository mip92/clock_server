export interface CircleDataSetInterface {
    label: string,
    data: number[],
    backgroundColor: string[]
}

export class CircleDataSet implements CircleDataSetInterface {
    backgroundColor: string[];
    data: number[];
    label: string;

    constructor(label: string, length:number) {
        this.label = label
        const arr= Array.from({length}, (v, k) => k);
        this.backgroundColor = arr.map((c)=>'#' + Math.floor(Math.random() * 16777215).toString(16))
        this.data = []
    }

    setData(orders: number) {
        this.data = [...this.data, orders]
    }
}