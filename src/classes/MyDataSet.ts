export interface DataSetInterface {
    label: string,
    data: number[],
}

export class MyDataSet implements DataSetInterface {
    data: number[];
    label: string;

    constructor(label: string) {
        this.label = label
        this.data = []
    }

    setData(orders: number) {
        this.data = [...this.data, orders]
    }
}