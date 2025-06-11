import { useState, createContext, useContext } from "react";

export type ChartMetadata = {
    id: string,
    title: string,
    artists: string,
    chart_author: string,
    bpm?: number,
    measure_size?: number,
    snaps_per_beat: number,
    audio: string,
    chart: string,
    img?: string
}

export enum Page {
    MAIN_MENU,
    SETTINGS,
    EDIT_MENU,
    SONG_SELECT,
    GAME,
    EDITOR,
}

export type IsEditing = boolean
export type ChartParams = ChartMetadata & {leaderboard: string}
export type PageParams = [Page] | [Page, ChartParams | IsEditing];

const PageContext = createContext<[PageParams, (next: PageParams) => void] | null>(null);

export function usePage() {
    return useContext(PageContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PageProvider({ children }: Props) {
    const pageParamsState = useState<PageParams>([Page.MAIN_MENU]);
    
    return (
        <PageContext.Provider value={pageParamsState}>
            { children }
        </PageContext.Provider>
    );
}