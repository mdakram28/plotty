import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";
import { COUNTRIES } from "../../sample-data";
import PlottyComponent from "./plotty.component";


export default {
    title: "Components/PlottyComponent",
    component: PlottyComponent,
} as ComponentMeta<typeof PlottyComponent>;


const Template: ComponentStory<typeof PlottyComponent> = (args) => <PlottyComponent {...args} />

export const BarChart = Template.bind({})
BarChart.args = {
    data: COUNTRIES,
    config: {
        plots: [{
            type: "bar",
            axis: 'primary',
            yField: 'Value',
            fill: 'grey',
            border: 'red',
            barWidth: 0.8
        },
        {
            type: "line",
            axis: 'secondary',
            yField: 'Value',
            color: 'blue'
        }
    ],
        x: {
            field: 'Country',
            scale: 'discrete',
            ticks: null,
            tickLabelRotate: 0
        },
        y1: {
            ticks: 5
        },
        y2: {
            ticks: 10
        },

        margin: {top: 50, bottom: 70, left: 60, right: 70},
        height: 500,
        width: 1000,
        box: false,
    }
}
