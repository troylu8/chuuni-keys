import bcrypt from "bcryptjs";
import { ChartMetadata, getChartFolder, OWNER_KEY, SERVER_URL } from "./lib";
import { readFile } from "@tauri-apps/plugin-fs";

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


/** returns `[ http status, online_id ]` */
export async function publish(metadata: ChartMetadata): Promise<string> {
    const chartFolder = getChartFolder(metadata);
    
    const body = new FormData();
    body.append("owner_hash", bcrypt.hashSync(OWNER_KEY));
    body.append("metadata", stringifyForPublish(metadata));
    body.append("chart", await getBlob(chartFolder + "\\chart.txt"));
    body.append("audio", await getBlob(`${chartFolder}\\audio.${metadata.audio_ext}`));
    if (metadata.img_ext)
        body.append("img", await getBlob(`${chartFolder}\\img.${metadata.img_ext}`));
    
    const resp = await fetch(SERVER_URL + "/charts", { method: "POST", body });
    if (resp.ok) 
        return await resp.text();
    else 
        throw new Error(`[${resp.status}] ${resp.statusText}`)
}


export async function unpublish(onlineId: string): Promise<number> {
    const resp = await fetch(SERVER_URL + "/charts/" + onlineId, { method: "DELETE", body: OWNER_KEY });
    return resp.status;
}