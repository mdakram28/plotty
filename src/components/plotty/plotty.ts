import * as d3 from "d3";
import { D3SelectionType } from "../../types/plot.type";
import { DataRow, LineProps, PlotBar, PlotLine, PlottyConfig, RectsProps } from "../../types/plotty.type";

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
            } else if (plot.type == 'line') {
                PlottyLine(this, this.data, this.config, plot)
            }
        }
    }

    private drawXAxis() {
        if (this.config.x.scale == 'linear') {
            const xValues = this.data.map(r => r[this.config.x.field as keyof T])
            const xScaleExtent = d3.extent(xValues as number[]) as [number, number]
            const extendEnds = Math.abs(xScaleExtent[1] - xScaleExtent[0]) * 0.05
            xScaleExtent[1] += extendEnds
            xScaleExtent[0] -= extendEnds



            this.xScale = d3.scaleLinear()
                .domain(xScaleExtent)
                .range([0, this.innerWidth!]);
            this.svg.append("g")
                .attr('id', 'xaxis')
                .attr("transform", `translate(0, ${this.innerHeight!})`)
                .call(d3.axisBottom(this.xScale));
        } else if (this.config.x.scale == 'discrete') {
            const xScaleExtent = this.data.map(r => r[this.config.x.field as keyof T].toString())
            this.xScale = d3.scaleBand()
                .domain(xScaleExtent)
                .range([0, this.innerWidth!]);
            this.svg.append("g")
                .attr('id', 'xaxis')
                .attr("transform", `translate(0, ${this.innerHeight})`)
                .call(d3.axisBottom(this.xScale));
        }

        if (this.config.x.tickLabelRotate) {
            this.svg.select('g#xaxis').selectAll("text")
                .attr("transform", `translate(-10,0)rotate(${this.config.x.tickLabelRotate})`)
                .style("text-anchor", "end");
        }

        // @ts-ignore
        const axisBbox = this.svg.select('g#xaxis').node().getBoundingClientRect()

        this.svg.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .attr("x", this.innerWidth! / 2)
            .attr("y", axisBbox.bottom - this.config.margin.top)
            .text(this.config.x.field);

        return this.xScale
    }

    private drawYAxis() {
        let yScale1Values: number[] = [0], yScale2Values: number[] = [0]
        const y1Plots = this.config.plots.filter(plot => plot.axis == "primary")
        const y2Plots = this.config.plots.filter(plot => plot.axis == "secondary")

        for (const plot of y1Plots) {
            yScale1Values.push(...this.data.map(r => r[plot.yField] as number))
        }
        for (const plot of y2Plots) {
            yScale2Values.push(...this.data.map(r => r[plot.yField] as number))
        }

        let yScale1Extent = d3.extent(yScale1Values) as [number, number]
        this.y1Scale = d3.scaleLinear()
            .domain(yScale1Extent)
            .range([this.innerHeight, 0]);

        this.svg.append("g")
            .attr('id', 'yaxis1')
            .call(d3.axisLeft(this.y1Scale)
                .ticks(this.config.y1.ticks))

        // @ts-ignore
        const axisBbox = this.svg.select('g#yaxis1').node().getBoundingClientRect()

        this.svg.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("x", -this.innerHeight / 2)
            .attr("y", -axisBbox.width)
            .attr('transform', 'rotate(-90)')
            .text('x')
            .text(this.config.plots.filter(p => p.axis == 'primary').map(p => p.yField).join(', '));

        if (yScale2Values.length >= 2) {
            let yScale2Extent = d3.extent(yScale2Values) as [number, number]
            // console.log(yScale2Values)
            this.y2Scale = d3.scaleLinear()
                .domain(yScale2Extent)
                .range([this.innerHeight, 0]);


            this.svg.append("g")
                .attr('id', 'yaxis2')
                .attr("transform", `translate(${this.innerWidth!}, 0)`)
                .call(d3.axisRight(this.y2Scale)
                    .ticks(this.config.y2.ticks));


            // @ts-ignore
            const axisBbox2 = this.svg.select('g#yaxis2').node().getBoundingClientRect()
            this.svg.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "middle")
                .attr("x", -this.innerHeight / 2)
                .attr("y", axisBbox2.width + this.innerWidth + 15)
                .attr('transform', 'rotate(-90)')
                .text('x')
                .text(this.config.plots.filter(p => p.axis == 'secondary').map(p => p.yField).join(', '));

            return [this.y1Scale, this.y2Scale]
        } else {
            return [this.y1Scale, undefined]
        }

    }

    private scaleUnit(scale: d3.ScaleLinear<any, any, any> | d3.ScaleBand<any>, type: 'discrete' | 'linear'): number {
        if (!scale) throw Error("Scale is null");
        const extent = scale.domain();
        if (type == 'linear') {
            return Math.abs((scale(extent[0]) - scale(extent[1])) / (extent[0] - extent[1]));
        } else {
            return (scale as d3.ScaleBand<any>).bandwidth();
        }
    }

    public getRunningDiff(vals: number[]): number[] {
        const diffs = []
        for (let i = 1; i < vals.length; i++) {
            diffs.push(vals[i] - vals[i - 1])
        }
        return diffs
    }

    public drawRects(props: RectsProps) {
        const yScale = props.axis == 'primary' ? this.y1Scale : this.y2Scale!
        const xScaleUnit = this.scaleUnit(this.xScale, this.config.x.scale);
        const yScaleUnit = this.scaleUnit(yScale, 'linear');
        // console.log(xScaleUnit)
        return this.clipArea.selectAll("rects")
            .data(props.rects)
            .enter()
            .append("rect")
            .attr("x", d => this.xScale(d.x) + xScaleUnit * d.xOffset)
            .attr("y", d => yScale(d.y) - yScaleUnit * d.yOffset)
            .attr("width", d => d.width * xScaleUnit)
            .attr("height", d => d.height * yScaleUnit)
            .attr("fill", props.fill)
            .attr("stroke", props.border)
    }

    public drawLine(props: LineProps) {
        const yScale = props.axis == 'primary' ? this.y1Scale : this.y2Scale!
        const xScaleUnit = this.scaleUnit(this.xScale, this.config.x.scale);
        const yScaleUnit = this.scaleUnit(yScale, 'linear');
        // console.log(this.xScale(19))
        this.clipArea
            .append("path")
            .datum(props.points)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", props.color)
            .attr("stroke-width", 1)
            // .attr("stroke-opacity", d => d[0].opacity)
            // @ts-ignore
            .attr("d", d3.line()
                .x((d: any) => this.xScale(d.x) + xScaleUnit * d.xOffset)
                .y((d: any) => yScale(d.y) - yScaleUnit * d.yOffset)
            )
    }
}

function PlottyBar<T extends DataRow>(plotty: Plotty<T>, data: T[], config: PlottyConfig<T>, plot: PlotBar) {
    const barWidth = config.x.scale == 'discrete' ? 1 : Math.min(...plotty.getRunningDiff(data.map(r => r[config.x.field] as number)))
    let barOffset = (barWidth * (1 - plot.barWidth)) / 2
    if (config.x.scale == 'linear') {
        barOffset -= barWidth / 2
    }

    const rects = data.map(r => ({
        x: r[config.x.field] as number,
        y: r[plot.yField] as number,
        xOffset: barOffset,
        yOffset: 0,
        width: barWidth * plot.barWidth,
        height: r[plot.yField] as number,
    }))

    const rectsSel = plotty.drawRects({
        axis: plot.axis,
        border: plot.border,
        fill: plot.fill,
        rects
    })

    if (plot.onHover) {
        rectsSel
            .on('mouseover', ((d: T, i: number, nodes: any) => {
                if (d3.select(nodes[i]).node().classList.contains('selected')) return
                d3.select(nodes[i])
                    .style("cursor", "pointer")
                    .attr('fill', plot.onHover!.fill)
                    .attr('stroke', plot.onHover!.border)
            }) as any)
            .on('mouseout', ((d: T, i: number, nodes: any) => {
                if (d3.select(nodes[i]).node().classList.contains('selected')) return
                d3.select(nodes[i])
                    .style("cursor", "default")
                    .attr('fill', plot.fill)
                    .attr('stroke', plot.border)
            }) as any)
    }

    if (plot.onSelect) {
        rectsSel
            .on('click', ((d: T, i: number, nodes: any) => {
                const node = d3.select(nodes[i]).node()
                node.classList.toggle('selected')
                if (node.classList.contains('selected')) {
                    d3.select('rect').each((d, i) => {
                        
                    })
                    d3.select(nodes[i])
                        .style("cursor", "pointer")
                        .attr('fill', plot.onSelect!.fill)
                        .attr('stroke', plot.onSelect!.border)
                    // console.log(plot.onSelect!.cb)
                    plot.onSelect!.cb(data[i])
                } else {
                    d3.select(nodes[i])
                        .style("cursor", "pointer")
                        .attr('fill', plot.fill)
                        .attr('stroke', plot.border)
                }
            }) as any)
    }

}

function PlottyLine<T extends DataRow>(plotty: Plotty<T>, data: T[], config: PlottyConfig<T>, plot: PlotLine) {
    const points = data.map(r => ({
        x: r[config.x.field] as number,
        y: r[plot.yField] as number,
        xOffset: config.x.scale == 'discrete' ? 0.5 : 0,
        yOffset: 0

    }))
    console.log(points)
    plotty.drawLine({
        axis: plot.axis,
        color: plot.color,
        points
    })
}