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

export type GameAndEditorParams = ChartMetadata & { song_folder: string }
export type SongSelectParams = { isEditing: boolean }

export type PageParams = [Page] | [ Page, GameAndEditorParams | SongSelectParams];

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