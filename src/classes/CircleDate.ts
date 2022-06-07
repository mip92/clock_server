import {MyDate} from "./MyDate";

export class CircleDate<T> extends MyDate<any>{

    constructor(lables: string[]) {
        super(lables)
    }

    setDatasets(datasets: T) {
        this.datasets = [...this.datasets, datasets]
    }

}