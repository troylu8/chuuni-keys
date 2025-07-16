import { openUrl } from "@tauri-apps/plugin-opener";


const CHART_LISTING_URL = "https://chuuni-keys.troylu.com/charts.html";

type Props = Readonly<{
    label?: string
}>
export default function ChartListingLink({ label = "chart listing" }: Props) {
    return (
        <span
            onClick={() => openUrl(CHART_LISTING_URL)}
            className="text-ctp-mauve hover:underline cursor-pointer"
        >{ label }</span>
    );
}