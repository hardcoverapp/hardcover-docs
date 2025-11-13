import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {
    type ChartConfig,
    ChartContainer,
    ChartLegend, ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from "@/components/ui/chart.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";
import {useTranslation} from "@/lib/utils.ts";
import React from "react";
import {ScrollArea} from "@/components/ui/scroll-area"
import {Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis} from "recharts";

interface ChartableData {
    isChartable: boolean;
    xAxisField?: string;
    yAxisFields?: string[];
    dataType?: 'timeseries' | 'categorical' | 'numeric';
    message?: string;
}

/**
 * Recursively flatten an object and collect field paths
 */
const flattenObjectPaths = (obj: any, prefix = ''): { [key: string]: any } => {
    const flattened: { [key: string]: any } = {};

    for (const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
            flattened[newKey] = value;
        } else if (Array.isArray(value)) {
            // Don't flatten arrays, keep them as is
            flattened[newKey] = value;
        } else if (typeof value === 'object') {
            // Check if it's a plain object (not a Date, etc.)
            if (value.constructor === Object) {
                // Recursively flatten nested objects
                Object.assign(flattened, flattenObjectPaths(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        } else {
            flattened[newKey] = value;
        }
    }

    return flattened;
};

/**
 * Get nested value from object using dot notation path
 */
const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

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
    const flattenedItem = flattenObjectPaths(firstItem);

    // Find numeric fields (potential Y-axis)
    const numericFields: string[] = [];
    // Find potential X-axis fields (dates, strings, or numbers that look like categories)
    const potentialXAxisFields: string[] = [];
    let dataType: 'timeseries' | 'categorical' | 'numeric' = 'categorical';

    for (const path in flattenedItem) {
        const value = flattenedItem[path];
        const type = typeof value;

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
    results: object,
    locale?: string,
}) => {
    const {results, locale = 'en'} = props;

    // Analyze the results to see if they're chartable
    const analysis = analyzeDataForCharting(results);

    // Extract the actual data array from results and flatten nested structures
    let chartData: any[] = [];
    if (analysis.isChartable) {
        for (const key in results) {
            if (Array.isArray(results[key])) {
                // Flatten each item in the array to handle nested structures
                chartData = results[key].map((item: any) => flattenObjectPaths(item));
                break;
            }
        }
    }

    // Build dynamic chart config based on Y-axis fields
    const chartConfig: ChartConfig = {};
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

    /**
     * Format field path into readable label
     * Examples: "book.pages" → "Book Pages", "rating" → "Rating"
     */
    const formatFieldLabel = (field: string): string => {
        return field
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    analysis.yAxisFields?.forEach((field, index) => {
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
    const filteredData = analysis.dataType === 'timeseries' && analysis.xAxisField && timeRange !== 'all'
        ? chartData.filter((item) => {
            const dateValue = new Date(item[analysis.xAxisField!]);
            if (isNaN(dateValue.getTime())) return true; // Include if date parsing fails

            const referenceDate = chartData.length > 0
                ? new Date(chartData[chartData.length - 1][analysis.xAxisField!])
                : new Date();

            const option = timeRangeOptions.find(opt => opt.value === timeRange);
            const daysToSubtract = option?.days || 90;

            const startDate = new Date(referenceDate);
            startDate.setDate(startDate.getDate() - daysToSubtract);
            return dateValue >= startDate;
        })
        : chartData; // No filtering for non-timeseries data or "all" selected

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
                        Showing {analysis.yAxisFields?.join(', ')} by {analysis.xAxisField} ({analysis.dataType})
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
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={filteredData}>
                        <defs>
                            {analysis.yAxisFields?.map((field, index) => (
                                <linearGradient key={field} id={`fill${field}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={chartConfig[field]?.color || colors[index % colors.length]}
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={chartConfig[field]?.color || colors[index % colors.length]}
                                        stopOpacity={0.1}
                                    />
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
                            tickFormatter={(value) => {
                                if (analysis.dataType === 'timeseries') {
                                    const date = new Date(value);
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }
                                return String(value);
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        if (analysis.dataType === 'timeseries') {
                                            return new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            });
                                        }
                                        return String(value);
                                    }}
                                    indicator="dot"
                                    className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg"
                                />
                            }
                        />
                        {analysis.yAxisFields?.map((field, index) => (
                            <Area
                                key={field}
                                dataKey={field}
                                type="natural"
                                fill={`url(#fill${field})`}
                                stroke={chartConfig[field]?.color || colors[index % colors.length]}
                                stackId="a"
                            />
                        ))}
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
};