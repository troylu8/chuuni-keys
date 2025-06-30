import { useState, createContext, useContext, useEffect } from "react";
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';

export type ChartMetadata = {
    id: string,
    title: string,
    
    bpm: number,
    measure_size: number,
    snaps: number,
    
    audio_ext: string,
    img_ext?: string,
    
    credit_audio?: string,
    credit_img?: string,
    credit_chart?: string,
}

export enum Page {
    MAIN_MENU,
    SETTINGS,
    EDIT_MENU,
    CHART_SELECT,
    GAME,
    EDITOR,
}

export type EditorParams = { metadata: ChartMetadata, isNew?: boolean }
export type ChartSelectParams = { isEditing: boolean, activeChartId?: string }

export type PageParams = [Page] | [ Page, ChartMetadata | ChartSelectParams | EditorParams];

const PageContext = createContext<[PageParams, (next: PageParams) => void] | null>(null);

export function usePage() {
    return useContext(PageContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PageProvider({ children }: Props) {
    const [page, setPageParams] = useState<PageParams>([Page.MAIN_MENU]);
    
    useEffect(() => {
        function handleDeepLink(url?: string) {
            if (url == undefined) return;
            
            // urls look like chuuni://play/<chart-id>
            const [key, value] = url.split("://")[1].split("/");
            if (key == "play") {
                setPageParams([Page.CHART_SELECT, { isEditing: false, activeChartId: value }]);
            }
        } 
        
        getCurrent().then(urls => handleDeepLink(urls?.[0]));
        const unlisten = onOpenUrl(urls => handleDeepLink(urls[0]));
        
        return () => { unlisten.then(unlisten => unlisten()); }
    }, []);
    
    return (
        <PageContext.Provider value={[page, setPageParams]}>
            { children }
        </PageContext.Provider>
    );
}