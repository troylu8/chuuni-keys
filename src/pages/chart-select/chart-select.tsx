import { ChartMetadata, Page, ChartSelectParams, usePage } from "../../providers/page";
import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ChartEntry from './chart-entry';
import ChartInfo from './chart-info';
import MainMenuButton from "../../components/main-menu-btn";


/** https://www.desmos.com/calculator/3zoigxxcl0 */
function distToCircle(x: number, radius: number) {
    if (x < 0 || x > radius * 2) return 0; // out of bounds
    return radius - Math.sqrt(radius * radius - (x - radius) * (x - radius));
}

export default function ChartSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[] | null>(null);
    const [[,params], setPageParams] = usePage();
    const { isEditing } = params as ChartSelectParams;
    
    
    // smooth scrolling
    const scrollingRef = useRef(false);
    const scrollTargetRef = useRef(0);
    const chartListRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        function scrollAnimation() {
            const chartList = chartListRef.current;
            if (!chartList) return;
            
            const delta = scrollTargetRef.current - chartList.scrollTop;

            // snap to target if close enough
            if (Math.abs(delta) < 1) {
                scrollingRef.current = false;
                chartList.scrollTop = scrollTargetRef.current;
            } else {
                scrollingRef.current = true;
                chartList.scrollTop += delta * 0.2;
                requestAnimationFrame(scrollAnimation);
            }
        }
        
        // can't use react's onWheel property bc it is passive
        function handleWheel(e: WheelEvent) {
            e.preventDefault();
            
            const chartList = chartListRef.current;
            if (!chartList) return;
            
            // clamp new scroll pos to valid values
            scrollTargetRef.current = Math.max(0, Math.min(scrollTargetRef.current + e.deltaY, chartList.scrollHeight - chartList.clientHeight));
            if (!scrollingRef.current) scrollAnimation(); // if already scrolling, don't start a new scrolling frame
        }
        
        chartList.addEventListener("wheel", handleWheel, { passive: false });
        return () => { chartList.removeEventListener("wheel", handleWheel); }
    }, [chartListRef.current]);
    
    
    const [activeChart, setActiveChart] = useState<ChartMetadata | null>(null);
    
    function updateEntryPositions() {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        const listRect = chartList.getBoundingClientRect();
        const listCenterY = (listRect.top + listRect.bottom) / 2;

        for (const entry of chartList.querySelectorAll("section")) {
            const entryRect = entry.getBoundingClientRect();

            // ignore entries that are out of sight
            if (entryRect.bottom < listRect.top || entryRect.top > listRect.bottom) continue;

            let deltaX;

            // if box is above center
            if (entryRect.bottom < listCenterY) {
                deltaX = distToCircle(listRect.bottom - entryRect.bottom, listRect.height / 2);
            }

            // if box is below center
            else if (entryRect.top > listCenterY) {
                deltaX = distToCircle(listRect.bottom - entryRect.top, listRect.height / 2);
            }

            // if box straddles center
            else deltaX = 0;
            
            // entries 45% from the left of the screen at the closest
            entry.style.left = listRect.width * 0.45 - deltaX + "px"; 
        }
    }
        
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(charts => {
            setCharts(charts);
            setActiveChart(charts?.[0] ?? null);
        });
        
        window.addEventListener("resize", updateEntryPositions);
        return () => { window.removeEventListener("resize", updateEntryPositions); }
    }, []);
    useEffect(updateEntryPositions, [charts]);
    
    async function startGame() {
        if (!activeChart)   return;
        if (isEditing)      setPageParams([Page.EDITOR, { metadata: activeChart }]);
        else                setPageParams([Page.GAME, activeChart]);
    }
    
    function handleEntryClick(metadata: ChartMetadata) {
        if (activeChart?.id != metadata.id) {
            setActiveChart(metadata);
        }
        else {
            startGame();
        }
    }
    
    return (
        <div className="fixed cover">
            <MainMenuButton />
            
            <ChartInfo
                metadata={activeChart} 
                onClick={startGame} 
            />
            
            {/* chart list */}
            <nav
                ref={chartListRef}
                onScroll={updateEntryPositions}
                className="absolute cover overflow-hidden flex flex-col gap-[10vh]"
            >
                {/* buffer top */}
                <div className="h-[20vh] shrink-0"></div>
                
                { charts && charts.map(metadata => 
                    <ChartEntry 
                        key={metadata.id}
                        metadata={metadata}
                        onClick={() => handleEntryClick(metadata)}
                        active={activeChart?.id == metadata.id}
                    />
                )}
                
                {/* buffer bottom */}
                <div className="h-[20vh] shrink-0"></div>
            </nav>
        </div>
    )
}

