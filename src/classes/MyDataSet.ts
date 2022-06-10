export interface DataSetInterface {
    label: string,
    data: number[],
    backgroundColor: string
}

export class MyDataSet implements DataSetInterface {
    backgroundColor: string;
    data: number[];
    label: string;

    constructor(label: string) {
        this.label = label
        this.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16)
        this.data = []
    }

    setData(orders: number) {
        this.data = [...this.data, orders]
    }
}