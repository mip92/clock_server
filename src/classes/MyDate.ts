import {MyDataSet} from "./MyDataSet";

export interface DataType {
    labels: Date[],
    datasets: MyDataSet[] | undefined
}

export class MyDate implements DataType {
    labels: Date[] = [];
    datasets: MyDataSet[] = [];

    constructor(lables: Date[]) {
        this.labels = lables
    }

    setDatasets(datasets: MyDataSet) {
        this.datasets = [...this.datasets, datasets]
    }

    setLable(lable: Date) {
        this.labels = [...this.labels, lable]
    }
}