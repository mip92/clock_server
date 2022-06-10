export interface DataType<T> {
    labels: string[],
    datasets: T[]
}

export class MyDate<T> implements DataType<T> {
    labels: string[] = [];
    datasets: T[] = [];

    constructor(lables: string[]) {
        this.labels = lables
    }

    setDatasets(datasets: T) {
        this.datasets = [...this.datasets, datasets]
    }

    setLable(lable: string) {
        this.labels = [...this.labels, lable]
    }
}