import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../contexts/page";
import MuseButton from '../../components/muse-button';
import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { resetAnimation, RESOURCE_DIR } from '../../lib/lib';
import NowPlaying from '../../components/now-playing';
import { useOnBeat } from '../../lib/sound';


export default function MainMenu() {
    const [,setPageParams] = usePage();
    
    // keybinds
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key == "Enter") setPageParams([Page.CHART_SELECT]);
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, []);
    
    
    const buttonsCont = useRef<HTMLDivElement | null>(null);
    
    const beatDuration = useOnBeat(beat => {
        const buttons = buttonsCont.current;
        if (!buttons) return;
        resetAnimation(buttons.children[beat % buttons.children.length] as HTMLElement)
    });
    
    return (
        <div className="fixed left-[7vw] top-[5vh] flex flex-col justify-center">
            <NowPlaying />
            
            <FlairText />
            
            <img src={convertFileSrc(RESOURCE_DIR + "\\logo.png")} className='w-[60vw]' />
            
            <div 
                ref={buttonsCont} 
                style={{animationDuration: beatDuration ? beatDuration + "ms" : ""}}
                className='
                    flex flex-col [&>button]:font-serif [&>button]:tracking-widest text-[5vh] text-ctp-blue
                    gap-[2vh] items-start
                '
            >
                <MuseButton className="anim-flash ml-[4vh] mt-[5vh]" onClick={() => setPageParams([Page.CHART_SELECT])}> song select </MuseButton>
                <MuseButton className="anim-flash ml-[2vh]" onClick={() => setPageParams([Page.SETTINGS])}> settings </MuseButton>
                <MuseButton className='anim-flash' onClick={() => exit(0)}> quit </MuseButton>
            </div>
        </div>
    );
}

function FlairText() {
    
    const FLAIR_TEXTS = [
        "the voice of fate calls your name",
        "beneath the facade, an identity only you know",
        "you, me, and delusions of grandeur",
        "heroes of the world only we can see",
        "the truth lies beneath a shattered reality"
    ];
    function getRandomFlairText() {
        return FLAIR_TEXTS[Math.floor(Math.random() * FLAIR_TEXTS.length)];
    }
    
    // flair text only applied on mount
    const [flairText] = useState(getRandomFlairText());
    
    return (
        <div className='
            fixed bottom-[17vh] right-0 w-[55vw] h-[40vh] 
            text-[5vh] font-serif tracking-[0.3em]
            opacity-25 flex flex-col-reverse
        '>
            <div className='max-h-full'>
                <div 
                    style={{shapeOutside: "polygon(0 0, 100% 0, 0 100%)"}}
                    className='h-full w-[15vw] float-left'
                >
                </div>
                
                { flairText }
            </div>
        </div>
    )
}