
export type DataRow = { [k: string]: number | string }

export type RectProps = {
    x: number, y: number,
    width: number, height: number,
    axis: 'primary' | 'secondary',
}


type PlotBase = {
    axis: 'primary' | 'secondary',
    yField: string,
}

export type PlotBar = {
    type: 'bar',
} & PlotBase

export type PlotLine = {
    type: 'line',
} & PlotBase

export type PlottyConfig<T> = {
    plots: (PlotBar | PlotLine)[],

    x: {
        field: string,
        scale: 'discrete' | 'linear',
        ticks: number | null
    }
    y1: {
        ticks: number
    },
    y2: {
        ticks: number
    }

    // Plot Config
    margin: { top: number, right: number, bottom: number, left: number }
    width: number,
    height: number,

    // ??
    box: boolean
}