import { useState, createContext, useContext } from "react";

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

export type ChartSelectParams = { isEditing: boolean }

export type PageParams = [Page] | [ Page, ChartMetadata | ChartSelectParams];

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