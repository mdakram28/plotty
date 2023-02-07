import * as d3 from "d3";
import { D3SelectionType } from "../../types/plot.type";
import { DataRow, PlotBar, PlottyConfig, RectProps } from "../../types/plotty.type";

export class Plotty<T extends DataRow> {
    private svgRef: React.RefObject<SVGSVGElement>;
    private data: T[]
    private config: PlottyConfig<T>

    public innerWidth: number
    public innerHeight: number

    private clipArea: D3SelectionType
    private svg: D3SelectionType
    public xScale: d3.ScaleBand<any> | d3.ScaleLinear<any, any>
    public y1Scale: d3.ScaleLinear<any, any>
    public y2Scale?: d3.ScaleLinear<any, any>
    

    public constructor(svgRef: React.RefObject<SVGSVGElement>, data: T[], config: PlottyConfig<T>) {
        this.svgRef = svgRef
        this.data = data
        this.config = config

        // Clear canvas
        d3.select(this.svgRef.current).selectAll("*").remove()

        // Calculate dimensions
        this.innerWidth = config.width - config.margin.left - config.margin.right;
        this.innerHeight = config.height - config.margin.top - config.margin.bottom;

        // Prepare canvas
        this.svgRef.current?.setAttribute('width', config.width.toString())
        this.svgRef.current?.setAttribute('height', config.height.toString())

        // Draw
        this.svg = d3.select(this.svgRef.current)
            .append("g")
            .attr("transform", `translate(${config.margin.left},${config.margin.top})`);
        this.clipArea = this.svg.append('g')
            .attr("clip-path", "url(#clip)");

        this.svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight)
            .attr("x", 0)
            .attr("y", 0);

        if (config.box) {
            const stroke = 1;
            this.svg.append('rect')
                .attr('x', stroke)
                .attr('y', stroke)
                .attr("width", this.innerWidth - 2 * stroke)
                .attr("height", this.innerHeight - 2 * stroke)
                .attr('style', `stroke:black;stroke-width:${stroke};fill:none`);
        }

        this.xScale = this.drawXAxis()
        const yScales = this.drawYAxis()
        this.y1Scale = yScales[0]!
        this.y2Scale = yScales[1]

        for (const plot of config.plots) {
            if (plot.type == 'bar') {
                PlottyBar(this, this.data, this.config, plot)
            }
        }
    }

    private drawXAxis() {
        if (this.config.x.scale == 'linear') {
            const xValues = this.data.map(r => r[this.config.x.field as keyof T])
            const xScaleExtent = d3.extent(xValues as number[]) as [number, number]

            this.xScale = d3.scaleLinear()
                .domain(xScaleExtent)
                .range([0, this.innerWidth!]);
            this.svg.append("g")
                .attr("transform", `translate(0, ${this.innerHeight!})`)
                .call(d3.axisBottom(this.xScale));
        } else if (this.config.x.scale == 'discrete') {
            const xScaleExtent = this.data.map(r => r[this.config.x.field as keyof T].toString())
            this.xScale = d3.scaleBand()
                .domain(xScaleExtent)
                .range([0, this.innerWidth!]);
            this.svg.append("g")
                .attr("transform", `translate(0, ${this.innerHeight})`)
                .call(d3.axisBottom(this.xScale));
        }

        this.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .attr("x", this.innerWidth! / 2)
            .attr("y", this.innerHeight! + 40)
            .text(this.config.x.field);

        return this.xScale
    }

    private drawYAxis() {
        let yScale1Values = [], yScale2Values = []
        const y1Plots = this.config.plots.filter(plot => plot.axis == "primary")
        const y2Plots = this.config.plots.filter(plot => plot.axis == "secondary")

        for (const plot of y1Plots) {
            yScale1Values.push(...this.data.map(r => r[plot.yField]))
        }
        for (const plot of y2Plots) {
            yScale2Values.push(...this.data.map(r => r[plot.yField]))
        }

        let yScale1Extent = d3.extent(yScale1Values as number[]) as [number, number]
        this.y1Scale = d3.scaleLinear()
            .domain(yScale1Extent)
            .range([this.innerHeight, 0]);

        this.svg.append("g")
            .call(d3.axisLeft(this.y1Scale)
                .ticks(this.config.y1.ticks))

        if (yScale2Values.length >= 2) {
            let yScale2Extent = d3.extent(yScale2Values as number[]) as [number, number]
            this.y2Scale = d3.scaleLinear()
                .domain(yScale2Extent)
                .range([this.innerHeight, 0]);


            this.svg.append("g")
                .attr("transform", `translate(${this.innerWidth!}, 0)`)
                .call(d3.axisRight(this.y2Scale)
                    .ticks(this.config.y2.ticks));

            return [this.y1Scale, this.y2Scale]
        } else {
            return [this.y1Scale, undefined]
        }

    }

    public drawRects(rects: RectProps[]) {
        const yScale = rects[0].axis == 'primary' ? this.y1Scale : this.y2Scale!
        this.clipArea.selectAll("rects")
            .data(rects)
            .enter()
            .append("rect")
            .attr("x", d => this.xScale(d.x))
            .attr("y", d => yScale(d.y))
            .attr("width", d => this.xScale(d.width))
            .attr("height", d => yScale(d.height))
    }
}

function PlottyBar<T extends DataRow>(plotty: Plotty<T>, data: T[], config: PlottyConfig<T>, plot: PlotBar) {
    // const barWidth = config.x.scale == 'linear' ? 20 : (plotty.xScale as d3.ScaleBand<any>).bandwidth()
    const rects: RectProps[] = data.map(r => ({
        x: r[config.x.field] as number,
        y: r[plot.yField] as number,
        width: 1,
        height: r[plot.yField] as number,
        axis: plot.axis
    }))
    console.log(rects)
    plotty.drawRects(rects)
}