import { Page, ChartSelectParams, usePage } from "../../contexts/page";
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ChartInfo from './chart-info';
import { ChartMetadata, compareDifficulty, flags, getChartFolder, SERVER_URL } from "../../lib/lib";
import bgm from "../../lib/sound";
import MuseButton from "../../components/muse-button";
import { ArrowLeft, EllipsisVertical, Plus, XIcon } from "lucide-react";
import { remove } from "@tauri-apps/plugin-fs";
import ChartList from "./chart-list";
import Modal from "../../components/modal";
import NowPlaying from "../../components/now-playing";


export default function ChartSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[]>([]);
    const [[,params], setPageParams] = usePage();
    
    
    const [activeChart, setActiveChartInner] = useState<ChartMetadata | null>(null);
    async function setActiveChart(metadata: ChartMetadata) {
        setActiveChartInner(metadata);
        flags.lastActiveChartId = metadata.id;
        
        const activeSongSrc = `${getChartFolder(metadata)}\\audio.${metadata.audio_ext}`;
        
        // this is a different song, so play it from the preview point
        if (bgm.src != activeSongSrc) {
            bgm.load(activeSongSrc, metadata);
            bgm.pos = metadata.preview_time;
            await bgm.play();
        }
        
        // this song is active but it was paused, so resume it
        else if (bgm.paused) {
            await bgm.play();
        }
        
        // if the this song is active and playing, do nothing (let it continue playing)
    }
    
    
    // load charts
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(charts => {
            charts.sort(compareDifficulty);
            setCharts(charts);
            
            const initialChartId = (params as ChartSelectParams)?.activeChartId ?? flags.lastActiveChartId;
            
            if (initialChartId == undefined) 
                return setActiveChart(charts?.[0] ?? null);
            
            const activeChart = charts.find(chart => chart.id == initialChartId);
            if (activeChart) 
                return setActiveChart(activeChart);
            
            // theres no chart with this id, so try to download it
            fetch(SERVER_URL + "/download/" + initialChartId)
            .then(resp => {
                if (resp.ok) return resp.bytes();
            })
            .then(buffer => {
                invoke<ChartMetadata>("unzip_chart", { buffer })
                .then(chartMetadata => {
                    setCharts([...charts, chartMetadata]);
                    setActiveChart(chartMetadata);
                })
            })
        });
    }, []);
    
    
    function play() {
        if (activeChart) 
            setPageParams([Page.GAME, activeChart]);
    }
    function edit() {
        if (activeChart) 
            setPageParams([Page.EDITOR, { metadata: activeChart }]);
    }
    
    function handleEntryClick(metadata: ChartMetadata) {
        if (activeChart?.id != metadata.id) setActiveChart(metadata);
        else                                play();
    }
    function handleEntryContextMenu(metadata: ChartMetadata) {
        if (activeChart?.id != metadata.id) setActiveChart(metadata);
        else                                edit();
    }
    
    async function deleteActiveChart() {
        if (!activeChart) return;
        
        // delete chart folder
        await remove(getChartFolder(activeChart), {recursive: true});
        
        // remove unsynced mark
        localStorage.removeItem("unsynced." + activeChart.id);
        
        // remove this active chart from charts[]
        setCharts(charts.filter(chart => chart.id != activeChart.id));
        
        // the next active chart is the chart before this one
        const i = charts.findIndex(chart => chart.id == activeChart.id);
        setActiveChart(charts[i == 0 ? 1 : i - 1]);
    }
    
    // keybinds
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!activeChart) return;
            
            if (e.key == "Enter") {
                if (e.shiftKey) edit();
                else            play();
            }
            
            else if (e.key == "ArrowUp") {
                const i = charts.findIndex(chart => chart.id == activeChart.id);
                if (i != 0) 
                    setActiveChart(charts[i - 1]);
            }
            else if (e.key == "ArrowDown") {
                const i = charts.findIndex(chart => chart.id == activeChart.id);
                if (i != charts.length - 1)
                    setActiveChart(charts[i + 1]);
            }
            
            else if (e.key == "Escape") {
                setPageParams([Page.MAIN_MENU]);
            }
        }
        
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, [activeChart, charts]);
    
    return (
        <div className="fixed cover bg-ctp-base">
            <NowPlaying />
            <NavigationBar />
            
            <ChartInfo metadata={activeChart} />
            
            <ChartList
                charts={charts}
                activeChartId={activeChart?.id}
                onEntryClick={handleEntryClick}
                onEntryContextMenu={handleEntryContextMenu}
            />
            
            <ActionsBar 
                activeSongId={activeChart?.id}
                play={play}
                edit={edit}
                deleteActiveChart={deleteActiveChart}
            />
        </div>
    )
}


function NavigationBar() {
    const [, setPageParams] = usePage();
    
    return (
        <nav className="absolute top-1 left-1 z-10 flex gap-3 text-ctp-mauve">
            <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}>
                <ArrowLeft /> quit
            </MuseButton>
            <MuseButton onClick={() => setPageParams([Page.NEW_CHART])}>
                <Plus /> new
            </MuseButton>
        </nav>
    )
}

enum ActionsState { DEFAULT, OPTIONS, DELETING }
type Props = Readonly<{
    activeSongId?: string
    play: () => any
    edit: () => any
    deleteActiveChart: () => any
}>
function ActionsBar({ activeSongId, play, edit, deleteActiveChart }: Props) {
    
    const [actionsState, setActionsState] = useState(ActionsState.DEFAULT);
    
    // close menu when active song changes
    useEffect(() => setActionsState(ActionsState.DEFAULT), [activeSongId]);
    
    
    return (
        <div className="
            absolute left-0 bottom-1/10 flex gap-1 ml-1 w-[35vw] z-10
            [&>*]:text-nowrap [&>*]:grow-1 [&>*]:py-0.5 [&>*]:px-3 text-ctp-base
            [&>*]:outline-[0.5vh] [&>*]:outline-ctp-base
        ">
            <MuseButton 
                onClick={() => setActionsState(actionsState == ActionsState.DEFAULT ? ActionsState.OPTIONS : ActionsState.DEFAULT)}
                className="bg-ctp-blue grow-0! px-0.5! "
            > 
                { actionsState == ActionsState.DEFAULT ? <EllipsisVertical /> : <XIcon /> }
            </MuseButton>
            
            { actionsState == ActionsState.DEFAULT ?
                <MuseButton onClick={play} className="bg-ctp-green font-mono"> 
                    [ play ] 
                </MuseButton>
                :
                <>
                    <MuseButton 
                        onClick={() => setActionsState(ActionsState.DELETING)}
                        className="bg-ctp-red grow-0! font-mono"
                    > 
                        [ delete ] 
                    </MuseButton>
                    <MuseButton onClick={edit} className="bg-ctp-blue font-mono"> 
                        [ edit ] 
                    </MuseButton>
                </>
            }
            
            { actionsState == ActionsState.DELETING &&
                <Modal onClose={() => setActionsState(ActionsState.OPTIONS)}>
                    <div className="p-2 flex flex-col text-ctp-text">
                        <p> delete this chart? </p>
                        <p> this can't be undone! </p>
                        <div className="text-ctp-base flex gap-2 justify-center">
                            <MuseButton 
                                className="bg-ctp-blue"
                                onClick={() => setActionsState(ActionsState.OPTIONS)}
                            > cancel </MuseButton>
                            <MuseButton 
                                className="bg-ctp-red"
                                onClick={deleteActiveChart}
                            > delete </MuseButton>
                        </div>
                    </div>
                </Modal>
            }
        </div>
    )
}
