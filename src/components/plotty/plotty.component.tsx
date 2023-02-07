import React, { useEffect, useRef } from 'react';
import { PlottyConfig } from '../../types/plotty.type';
import { Plotty } from './plotty';

export default function PlottyComponent<T extends {[k: string] : number | string}>(props: {
    data: T[],
    config: PlottyConfig<T>
}) {
    const { data, config } = props
    const svgRef = useRef(null)

    useEffect(() => {
        const plotty = new Plotty(svgRef, data, config)
    }, [svgRef, data, config])

    return (
        <div>
            <svg style={{ border: "1pX solid red" }} ref={svgRef} />
        </div>
    )

}
