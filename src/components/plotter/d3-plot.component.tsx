import { ClearOutlined, ColumnWidthOutlined, DownloadOutlined, FullscreenOutlined, RedoOutlined, ZoomInOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Table, Tabs, Tooltip } from "antd";
import * as d3 from "d3";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import ReactJson from "react-json-view";
import { useElementSize } from "usehooks-ts";
import { D3PlotDimensionsType, MarkerUpdateCallback, Range } from "../../types/plot.type";
import { D3Plot } from "./d3-plot";
import { D3PlotBase } from "./d3-plot-base";
import "./style.scss";

export const D3PlotComponent = (props: {
    plots: D3PlotBase<any>[];
    onMarkerUpdate?: MarkerUpdateCallback,
    onLogsClick?: (range: Range) => void,
    extraControls?: ReactNode,
    height?: number,
    width?: number,
    margin?: { top: number, right: number, bottom: number, left: number }
}) => {

    const { plots, onMarkerUpdate, onLogsClick, extraControls } = props;

    const svgRef = useRef(null);
    const [svgContainerRef, containerDimensions] = useElementSize<HTMLDivElement>();
    const [dimensions, setDimensions] = useState<D3PlotDimensionsType>({
        width: props.width || 600,
        height: props.height || 900,
        margin: props.margin || { top: 70, right: 80, bottom: 70, left: 80 }
    });
    const [plot, setPlot] = useState<D3Plot | null>(null);
    const [isBrushing, setIsBrushing] = useState(false);
    const [selectedRange, setSelectedRange] = useState<Range | null>(null);
    const [jsonData, setJsonData] = useState<any>();

    const redraw = () => {
        // console.log(plots)
        const plot = new D3Plot(svgRef, dimensions, plots);
        plot.clear();
        plot.draw();
        setPlot(plot);
        plot.onMarkerUpdate(onMarkerUpdate);
    }

    useEffect(() => {
        setDimensions(d => ({
            ...d,
            width: containerDimensions.width || 1000,
            height: (containerDimensions.width || 1000) * 0.45
        }));
        console.log(containerDimensions)
    }, [containerDimensions.width, containerDimensions.height]);

    useEffect(() => {
        setDimensions(d => ({ ...d, margin: props.margin || { top: 70, right: 80, bottom: 70, left: 80 } }))
    }, [props.margin])

    useEffect(redraw, [dimensions, plots, svgRef])

    function makeTable(plotData: D3PlotBase<any>) {
        const data: any = {}
        const fields = new Set()
        const columns: any = {
            index: {
                title: 'Index',
                dataIndex: 'index',
                key: 'index'
            }
        }
        plotData.dfGroups.forEach((gid, df, dfIndex) => {
            // @ts-ignore
            const yField = df.colName
            fields.add(yField)
            if (!columns[gid]) {
                columns[gid] = {
                    title: gid,
                    dataIndex: gid,
                    key: gid
                }
            }
            df.rows.forEach(row => {
                const x = row[df.indexField!]
                const y = Math.round(row[yField] * 100) / 100;
                if (!data[x]) {
                    data[x] = {
                        index: x
                    }
                }
                data[x][gid] = y
            })
        })
        for (const x in data) {
            const row = data[x]
            if (row.tasq && row.beta) {
                row.tasq_beta = Math.round((row.tasq - row.beta) * 10000 / row.beta) / 100
                if (!columns.tasq_beta) {
                    columns.tasq_beta = {
                        title: 'TASQ/BETA',
                        dataIndex: 'tasq_beta',
                        key: 'tasq_beta'
                    }
                }
            }
            if (row.tasq && row.dash) {
                row.tasq_dash = Math.round((row.tasq - row.dash) * 10000 / row.dash) / 100
                if (!columns.tasq_dash) {
                    columns.tasq_dash = {
                        title: 'TASQ/DASH',
                        dataIndex: 'tasq_dash',
                        key: 'tasq_dash'
                    }
                }
            }
        }
        // console.log(Object.values(data), Object.values(columns))
        return <>
            <h3>{Array.from(fields).join(', ')}</h3>
            <Table dataSource={Object.values(data) as any} columns={Object.values(columns) as any}></Table>
        </>
    }

    return <>
        <Space style={{ width: "100%", padding: "5px" }}>
            {extraControls}

            <Button type="primary" icon={<DownloadOutlined />} onClick={() => {
                var svgObject: SVGElement = svgRef.current!;
                var svgBlob = new Blob([svgObject.outerHTML], { type: "image/svg+xml;charset=utf-8" });
                var svgUrl = URL.createObjectURL(svgBlob);
                var downloadLink = document.createElement("a");
                downloadLink.href = svgUrl;
                downloadLink.download = "plot.svg";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }} />
            <Button type="primary" icon={<RedoOutlined />} onClick={redraw} />
            <Tooltip title="Select Area to Zoom">
                <Button disabled={isBrushing} type="primary" icon={<ZoomInOutlined />} onClick={() => {
                    setIsBrushing(true);
                    plot!.startBrush("xy", (extents) => {
                        plot?.clearBrush()
                        plot!.zoomToExtent(extents);
                        setIsBrushing(false)
                    });
                }} />
            </Tooltip>
            <Tooltip title="Zoom out">
                <Button disabled={isBrushing} type="primary" icon={<FullscreenOutlined />} onClick={() => {
                    plot!.resetZoom();
                }} />
            </Tooltip>
            <Tooltip title="Add Marker">
                <Button disabled={isBrushing} type="primary" icon={<ColumnWidthOutlined />} onClick={() => {
                    plot!.clearTemp();
                    setIsBrushing(true);
                    plot!.startBrush("x", (extents) => {
                        plot?.clearBrush()
                        setIsBrushing(false)
                        plot!.addTempRect(extents);
                        const invert = (plot!.xScale as d3.ScaleLinear<any, any>).invert;
                        const range = {
                            start: invert(extents[0][0]),
                            end: invert(extents[1][0]),
                        }
                        setSelectedRange(range);
                        if (onMarkerUpdate) {
                            onMarkerUpdate([range]);
                        }
                    });
                }} />
            </Tooltip>
            <Tooltip title="Clear Markers">
                <Button disabled={isBrushing} type="primary" icon={<ClearOutlined />} onClick={() => {
                    plot!.clearTemp();
                }} />
            </Tooltip>
            <Button disabled={isBrushing} type="link" onClick={e => onLogsClick && onLogsClick(selectedRange!)}
                target="_blank">Open Selected Logs
            </Button>
            <Button type="link" onClick={e => setJsonData(plots)}
                target="_blank">View JSON data
            </Button>
        </Space>

        <div style={{ border: "1pX solid red", position: 'relative', overflow: 'visible' }} ref={svgContainerRef}>
            <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        </div>


        <Modal
            title="Plot Data"
            centered
            visible={jsonData}
            onOk={() => setJsonData(undefined)}
            onCancel={() => setJsonData(undefined)}
            width={1000}
        >
            <Tabs>
                <Tabs.TabPane tab="JSON" key="item-1">
                    <ReactJson src={jsonData!} style={{ maxHeight: '80vh', overflow: 'scroll' }} collapsed={3} />
                </Tabs.TabPane>
                <Tabs.TabPane tab="Table" key="item-2">
                    {(jsonData || []).map(makeTable)}
                    {/* <Table dataSource={jsonData={}} columns={columns} />; */}
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    </>;
}