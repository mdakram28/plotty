
export type DataRow = { [k: string]: number | string }

export type RectsProps = {
    axis: 'primary' | 'secondary',
    fill: string, border: string,
    rects: {
        x: number, y: number,
        xOffset: number, yOffset: number,
        width: number, height: number,
    }[]
}

export type LineProps = {
    axis: 'primary' | 'secondary'
    color: string,
    points: {
        x: number, y: number,
        xOffset: number, yOffset: number,
    }[]
}













type PlotBase = {
    axis: 'primary' | 'secondary',
    yField: string,
}

export type PlotBar = {
    type: 'bar',
    barWidth: number,
    fill: string,
    border: string,
    onHover?: {
        fill: string,
        border: string
    },
    onSelect?: {
        fill: string,
        border: string,
        cb: (...args: any[]) => void
    }
} & PlotBase

export type PlotLine = {
    type: 'line',
    color: string,
} & PlotBase

export type PlottyConfig<T> = {
    plots: (PlotBar | PlotLine)[],

    x: {
        field: string,
        scale: 'discrete' | 'linear',
        ticks: number | null,
        tickLabelRotate: number
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