import {StandardChartFormatter} from './standard-chart-formatter';
import {StockChartFormatter} from './stock-chart-formatter';
import {HeatmapChartFormatter} from './heatmap-chart-formatter';

type configObj = { heatmap: {enabled: boolean}, stock: boolean };
type chartFormatterType = StandardChartFormatter | StockChartFormatter | HeatmapChartFormatter | any;

class ChartFormatterFactory {
    public static create(config: configObj): chartFormatterType {
        if (config && config.stock === true) {
            return new StockChartFormatter(config);
        }else if (config && config.heatmap.enabled === true) {
            return new HeatmapChartFormatter(config);
        }else if(config) {
            return new StandardChartFormatter(config);
        }
    }
}

export = ChartFormatterFactory;