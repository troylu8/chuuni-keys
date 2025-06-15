import { useState, createContext, useContext } from "react";

export type ChartMetadata = {
    id: string,
    title: string,
    
    bpm?: number,
    measure_size?: number,
    snaps: number,
    
    audio: string,
    img?: string,
    
    credit_audio?: string,
    credit_img?: string,
    credit_chart?: string,
}

export enum Page {
    MAIN_MENU,
    SETTINGS,
    EDIT_MENU,
    SONG_SELECT,
    GAME,
    EDITOR,
}

/** [metadata, song folder] */
export type GameAndEditorParams = [ChartMetadata, string]
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