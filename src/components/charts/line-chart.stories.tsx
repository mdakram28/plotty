import { ComponentMeta, ComponentStory } from "@storybook/react";
import React, { useMemo } from "react";
import { COUNTRIES } from "../../sample-data";
import { D3PlotBase } from "../plotter/d3-plot-base";
import { D3PlotLineProps } from "../plotter/d3-plot-line";
import { D3PlotComponent } from "../plotter/d3-plot.component";
import { DataFrame } from "../plotter/dataframe";





const LineChartComponent = function <T>(props: {
    data: T[],
    indexField?: string,
    config?: Partial<D3PlotLineProps<T>>,
    margin?: { top: number, right: number, bottom: number, left: number }
}) {
    const plots = useMemo<D3PlotBase<T>[]>(() => 
        new DataFrame<T>(props.data, props.indexField as keyof T).plotLine([], props.config), 
    [props.data, props.config, props.margin])

    return <><D3PlotComponent plots={plots} margin={props.margin}/></>
}


export default {
    title: "Components/LineChartComponent",
    component: LineChartComponent,
} as ComponentMeta<typeof LineChartComponent>;


export const BarChartStory: ComponentStory<typeof LineChartComponent> = (args) => <LineChartComponent {...args} />
BarChartStory.args = {
    data: COUNTRIES,
    indexField: 'Country',
    config: {
        fix: false,
        axisIndex: undefined,
        opacity: 1,
        legendLabels: {},
        xLabel: '',
        yLabel: ''
    },
    margin: { top: 70, right: 80, bottom: 70, left: 80 }
}
