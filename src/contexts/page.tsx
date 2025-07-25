import { useState, createContext, useContext, useEffect } from "react";
import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { ChartMetadata } from "../lib/lib";


export enum Page {
    MAIN_MENU,
    SETTINGS,
    NEW_CHART,
    CHART_SELECT,
    GAME,
    EDITOR,
}

export type EditorParams = { metadata: ChartMetadata, isNew?: boolean }
export type ChartSelectParams = { activeChartId?: string }

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
            if (key == "play") 
                setPageParams([Page.CHART_SELECT, { activeChartId: value }]);
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