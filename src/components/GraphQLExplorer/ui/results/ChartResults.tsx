import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend, ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import React from "react";
import {Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis} from "recharts";
import {flattenPaths, formatFieldLabel, sortByDate, withinDaysOfNewest} from "../../lib/shape";

interface ChartableData {
    isChartable: boolean;
    xAxisField?: string;
    yAxisFields?: string[];
    dataType?: 'timeseries' | 'categorical' | 'numeric';
    message?: string;
}

/**
 * Analyze GraphQL results to determine if they can be charted
 */
const analyzeDataForCharting = (results: any): ChartableData => {
    // Check if results exist and is an object
    if (!results || typeof results !== 'object') {
        return { isChartable: false, message: 'No results to chart' };
    }

    // Extract the actual data array from the results object
    // GraphQL typically returns { queryName: [...data] }
    let dataArray: any[] = [];

    for (const key in results) {
        if (Array.isArray(results[key])) {
            dataArray = results[key];
            break;
        }
    }

    // Must be an array with at least 2 items
    if (!Array.isArray(dataArray) || dataArray.length < 2) {
        return { isChartable: false, message: 'Insufficient data points for charting (minimum 2 required)' };
    }

    // Analyze the first item to understand the schema (with flattening for nested objects)
    const firstItem = dataArray[0];
    if (!firstItem || typeof firstItem !== 'object') {
        return { isChartable: false, message: 'Invalid data structure' };
    }

    // Flatten the first item to get all field paths
    const flattenedItem = flattenPaths(firstItem);

    // Find numeric fields (potential Y-axis)
    const numericFields: string[] = [];
    // Find potential X-axis fields (dates, strings, or numbers that look like categories)
    const potentialXAxisFields: string[] = [];
    let dataType: 'timeseries' | 'categorical' | 'numeric' = 'categorical';

    for (const path in flattenedItem) {
        const value = flattenedItem[path];
        const type = typeof value;

        // Skip id fields
        if (path.toLowerCase().includes('id')) {
          continue;
        }

        if (type === 'number' && !isNaN(value)) {
            numericFields.push(path);
        } else if (type === 'string') {
            // Check if it's a date string
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime()) && value.match(/\d{4}-\d{2}-\d{2}/)) {
                potentialXAxisFields.push(path);
                dataType = 'timeseries';
            } else {
                potentialXAxisFields.push(path);
            }
        }
    }

    // Need at least one numeric field
    if (numericFields.length === 0) {
        return { isChartable: false, message: 'No numeric fields found for charting' };
    }

    // Try to pick the best X-axis field
    let xAxisField: string | undefined;

    // Prefer date fields
    const dateFields = potentialXAxisFields.filter(path => {
        const value = flattenedItem[path];
        const dateValue = new Date(value);
        return !isNaN(dateValue.getTime());
    });

    if (dateFields.length > 0) {
        xAxisField = dateFields[0];
        dataType = 'timeseries';
    } else if (potentialXAxisFields.length > 0) {
        xAxisField = potentialXAxisFields[0];
        dataType = 'categorical';
    } else {
        // Use the first non-numeric field or create an index
        xAxisField = 'index';
        dataType = 'numeric';
    }

    return {
        isChartable: true,
        xAxisField,
        yAxisFields: numericFields,
        dataType
    };
};

export const ChartResults = (props: {
    results: Record<string, any>,
}) => {
    const {results} = props;

    // Analyze the results to see if they're chartable
    const analysis = analyzeDataForCharting(results);

    // Extract the actual data array from results and flatten nested structures
    let chartData: any[] = [];
    if (analysis.isChartable) {
        for (const key in results) {
            if (Array.isArray(results[key])) {
                // Flatten each item in the array to handle nested structures
                chartData = results[key].map((item: any) => flattenPaths(item));
                break;
            }
        }
    }

    // Categorical order is left alone: "most liked first" is meaningful and
    // sorting it would throw that away. Only a time axis gets reordered.
    if (analysis.dataType === 'timeseries' && analysis.xAxisField) {
        chartData = sortByDate(chartData, analysis.xAxisField);
    }

    // Build dynamic chart config based on Y-axis fields
    const chartConfig: ChartConfig = {};
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

    // Hues cycle past the five defined slots rather than the series being
    // capped. This is a showcase of how a result *might* be rendered, not an
    // analytics tool — seeing every field you asked for matters more here than
    // guaranteeing each one a unique hue. The legend names them either way.
    const series = analysis.yAxisFields ?? [];

    series.forEach((field, index) => {
        chartConfig[field] = {
            label: formatFieldLabel(field),
            color: colors[index % colors.length]
        };
    });

    /**
     * Calculate available time range options based on actual data
     */
    const getTimeRangeOptions = (): { value: string; label: string; days: number }[] => {
        if (analysis.dataType !== 'timeseries' || !analysis.xAxisField || chartData.length === 0) {
            return [];
        }

        // Get all dates from the data
        const dates = chartData
            .map(item => new Date(item[analysis.xAxisField!]))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        if (dates.length < 2) return [];

        // Calculate the span in days
        const oldestDate = dates[0];
        const newestDate = dates[dates.length - 1];
        const spanInDays = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));

        // Build options based on data span
        const options: { value: string; label: string; days: number }[] = [];

        if (spanInDays > 7) options.push({ value: '7d', label: 'Last 7 days', days: 7 });
        if (spanInDays > 30) options.push({ value: '30d', label: 'Last 30 days', days: 30 });
        if (spanInDays > 90) options.push({ value: '90d', label: 'Last 3 months', days: 90 });
        if (spanInDays > 180) options.push({ value: '180d', label: 'Last 6 months', days: 180 });
        if (spanInDays > 365) options.push({ value: '365d', label: 'Last year', days: 365 });

        // Always add "All" option if we have multiple time periods
        if (options.length > 0) {
            options.push({ value: 'all', label: 'All time', days: spanInDays });
        }

        return options;
    };

    const timeRangeOptions = getTimeRangeOptions();
    const [timeRange, setTimeRange] = React.useState(timeRangeOptions[timeRangeOptions.length - 1]?.value || 'all');

    // Filter data based on time range (only for timeseries data)
    const windowDays = timeRangeOptions.find((option) => option.value === timeRange)?.days;

    const filteredData =
        analysis.dataType === 'timeseries' && analysis.xAxisField && timeRange !== 'all' && windowDays
            ? withinDaysOfNewest(chartData, analysis.xAxisField, windowDays)
            : chartData;

    /**
     * The mark follows the data's job.
     *
     * A smoothed area between named categories draws a curve through space that
     * has no in-between, implying a continuum that isn't there. Only a time axis
     * earns that, and only a single series earns a filled area — multiple filled
     * series over time read better as lines.
     */
    const mark: 'area' | 'line' | 'bar' =
        analysis.dataType === 'timeseries'
            ? (series.length === 1 ? 'area' : 'line')
            : 'bar';

    // Long category names are unreadable on a horizontal axis; turn the bars.
    const categoryLabels = filteredData.map((item) => String(item[analysis.xAxisField ?? ''] ?? ''));
    const longestLabel = categoryLabels.reduce((longest, label) => Math.max(longest, label.length), 0);
    const horizontalBars = mark === 'bar' && longestLabel > 20;

    // Horizontal bars need room per row or they squash together, so the plot
    // grows with the category count and the container scrolls once it passes
    // MAX_CHART_HEIGHT. Squeezing 60 categories into a fixed height would make
    // every bar unreadable; letting the card grow to 2000px is worse.
    const chartHeight = horizontalBars
        ? Math.max(250, filteredData.length * 34 + 60)
        : 250;

    const formatAxisValue = (value: unknown): string => {
        if (analysis.dataType === 'timeseries') {
            return new Date(value as string).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
        return String(value);
    };

    const tooltip = (
        <ChartTooltipContent
            labelFormatter={(value) => formatAxisValue(value)}
            indicator={mark === 'bar' ? 'line' : 'dot'}
            className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg"
        />
    );

    // If data is not chartable, show message
    if (!analysis.isChartable) {
        return (
            <div className="rounded-lg bg-slate-50 border border-gray-300 text-gray-900 text-sm block w-full min-h-64 p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                <pre role="log">{analysis.message || 'Unable to chart this data'}</pre>
            </div>
        );
    }

    return (
        <Card className="pt-0 border-0 p-0 m-0">
            <CardHeader className="flex items-center gap-2 space-y-0 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Chart Results</CardTitle>
                    <CardDescription>
                        Showing {analysis.yAxisFields?.map(formatFieldLabel).join(', ')} by{' '}
                        {formatFieldLabel(analysis.xAxisField ?? '')} ({analysis.dataType})
                    </CardDescription>
                </div>
                {timeRangeOptions.length > 0 && (
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex border-0"
                            aria-label="Select a time range"
                        >
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg">
                            {timeRangeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className="rounded-lg">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 max-h-[28rem] overflow-y-auto">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto w-full"
                    style={{ height: chartHeight }}
                >
                    {mark === 'area' ? (
                        <AreaChart data={filteredData}>
                            <defs>
                                {series.map((field, index) => (
                                    <linearGradient key={field} id={`fill${field}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={analysis.xAxisField || 'index'}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={formatAxisValue}
                            />
                            <ChartTooltip cursor={false} content={tooltip} />
                            {series.map((field, index) => (
                                <Area
                                    key={field}
                                    dataKey={field}
                                    type="monotone"
                                    fill={`url(#fill${field})`}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    ) : mark === 'line' ? (
                        <LineChart data={filteredData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={analysis.xAxisField || 'index'}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={formatAxisValue}
                            />
                            <ChartTooltip cursor={false} content={tooltip} />
                            {series.map((field, index) => (
                                <Line
                                    key={field}
                                    dataKey={field}
                                    type="monotone"
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </LineChart>
                    ) : (
                        <BarChart
                            data={filteredData}
                            layout={horizontalBars ? 'vertical' : 'horizontal'}
                            barGap={2}
                        >
                            <CartesianGrid vertical={horizontalBars} horizontal={!horizontalBars} />
                            {horizontalBars ? (
                                <>
                                    {/* Top-anchored: a tall bar list scrolls, and
                                        an axis at the bottom would be out of view
                                        the moment it does. */}
                                    <XAxis
                                        type="number"
                                        orientation="top"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey={analysis.xAxisField || 'index'}
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        width={180}
                                        tickFormatter={(value) => {
                                            const label = String(value);
                                            return label.length > 28 ? `${label.slice(0, 27)}…` : label;
                                        }}
                                    />
                                </>
                            ) : (
                                <XAxis
                                    dataKey={analysis.xAxisField || 'index'}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={formatAxisValue}
                                />
                            )}
                            <ChartTooltip cursor={false} content={tooltip} />
                            {series.map((field, index) => (
                                <Bar
                                    key={field}
                                    dataKey={field}
                                    fill={colors[index % colors.length]}
                                    radius={horizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                                />
                            ))}
                            <ChartLegend content={<ChartLegendContent />} />
                        </BarChart>
                    )}
                </ChartContainer>
            </CardContent>
        </Card>
    );
};