import { NewsPage } from '@/components/MarketTerminal';
export default function AssetNews({ params }: { params: { asset: string } }) { return <NewsPage assetId={params.asset}/>; }
