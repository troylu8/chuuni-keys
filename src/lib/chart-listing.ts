import bcrypt from "bcryptjs";
import { ChartMetadata, getChartFolder, OWNER_KEY, SERVER_URL } from "./lib";
import { readFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

async function getBlob(filepath: string) {
    return new Blob([await readFile(filepath)]);
}

function stringifyForPublish(metadata: ChartMetadata) {
    return JSON.stringify(metadata, (key, val) => 
        [   // remove these from metadata before sending to server
            "id", 
            "online_id", 
            "owner_hash",
        ]
        .includes(key) ? undefined : val
    );
}


async function throwIfNotOk(resp: Response) {
    if (!resp.ok) 
        throw new Error(`[${resp.status}] ${resp.statusText}`);
    return resp;
}


export async function publishChart(metadata: ChartMetadata) {
    const chartFolder = getChartFolder(metadata);
    const owner_hash = bcrypt.hashSync(OWNER_KEY);
    
    const body = new FormData();
    body.append("owner_hash", owner_hash);
    body.append("metadata", stringifyForPublish(metadata));
    body.append("chart", await getBlob(chartFolder + "\\chart.txt"));
    body.append("audio", await getBlob(`${chartFolder}\\audio.${metadata.audio_ext}`));
    if (metadata.img_ext)
        body.append("img", await getBlob(`${chartFolder}\\img.${metadata.img_ext}`));
    
    const resp = await fetch(SERVER_URL + "/charts", { method: "POST", body }).then(throwIfNotOk);
    return { online_id: await resp.text(), owner_hash };
}


export async function updateChart(metadata: ChartMetadata): Promise<void> {
    if (!metadata.online_id) throw new Error("tried to update a chart without an online id");
    
    const chartFolder = getChartFolder(metadata);
    
    const body = new FormData();
    body.append("owner_key", OWNER_KEY);
    body.append("metadata", stringifyForPublish(metadata));
    body.append("chart", await getBlob(chartFolder + "\\chart.txt"));
    if (metadata.img_ext)
        body.append("img", await getBlob(`${chartFolder}\\img.${metadata.img_ext}`));
    
    await fetch(SERVER_URL + "/charts/" + metadata.online_id, { method: "PATCH", body }).then(throwIfNotOk);
}


export async function unpublishChart(chart: {online_id?: string}): Promise<void> {
    if (!chart.online_id) throw new Error("tried to update a chart without an online id");
    
    await fetch(SERVER_URL + "/charts/" + chart.online_id, { method: "DELETE", body: OWNER_KEY }).then(throwIfNotOk);
}

export async function downloadChart(online_id: string): Promise<ChartMetadata> {
    const resp = await fetch(SERVER_URL + "/charts/download/" + online_id).then(throwIfNotOk);
    return await invoke<ChartMetadata>("unzip_chart", { buffer: await resp.bytes() })
}