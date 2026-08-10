import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/ui/chart";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import {
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  RadialBar,
  XAxis,
  RadialBarChart,
  YAxis,
  AreaChart,
} from "recharts";

export function RevenueChart({ chartData }) {
  const chartConfig = {
    revenue: {
      label: "درآمد",
      color: "var(--color-primary)",
    },
  };

  return (
    <div className="lg:col-span-2 w-full px-2 py-3">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>درآمد ۳۰ روز اخیر 💰</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-70 w-full">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={3}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("fa-IR", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                    labelFormatter={(value) =>
                      new Intl.DateTimeFormat("fa-IR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }).format(new Date(value))
                    }
                    formatter={(value) => [
                      `${Number(value).toLocaleString("fa-IR")} تومان `,
                      "درآمد",
                    ]}
                  />
                }
              />

              <Area
                dataKey="revenue"
                type="monotone"
                stroke="var(--color-revenue)"
                fill="var(--color-revenue)"
                fillOpacity={0.14}
                strokeWidth={2}
                isAnimationActive
                animationDuration={1000}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function GenderSalesPieChart({ genderSales }) {
  const chartConfig = {
    percent: {
      label: "درصد فروش",
    },

    male: {
      label: "مردانه",
      color: "var(--color-stroke-800)",
    },

    female: {
      label: "زنانه",
      color: "var(--color-primary)",
    },

    unisex: {
      label: "یونیسکس",
      color: "var(--color-orange)",
    },
  };

  const genderKey = {
    مردانه: "male",
    زنانه: "female",
    یونیسکس: "unisex",
  };

  const chartData =
    genderSales?.map((item) => ({
      ...item,
      fill: `var(--color-${genderKey[item.gender]})`,
    })) ?? [];

  return (
    <div className="w-full px-2 py-3">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>فروش بر اساس جنسیت 📦</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-80 w-full">
            <PieChart accessibilityLayer>
              <Pie
                data={chartData}
                dataKey="percent"
                nameKey="gender"
                outerRadius="75%"
                paddingAngle={4}
                cornerRadius={8}
                label={({ name, percent }) =>
                  `${name} ${toPersianNumbers(percent)}٪`
                }
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                    formatter={(value) => [
                      `${toPersianNumbers(value)}٪ `,
                      "فروش",
                    ]}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function BrandSalesBarChart({ brandSales }) {
  const chartConfig = {
    percent: {
      label: "درصد فروش",
      color: "var(--chart-1)",
    },
  };

  const brandChartData =
    brandSales?.map((item, index) => ({
      ...item,
      fill: `var(--chart-${(index % 5) + 1})`,
    })) ?? [];

  return (
    <div className="w-full px-2 py-3">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>پرفروش‌ترین برندها 👤</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-80 w-full">
            <BarChart
              accessibilityLayer
              data={brandChartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />

              <XAxis
                dataKey="brand"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => toPersianNumbers(value)}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                  />
                }
                formatter={(value) => [`${toPersianNumbers(value)}٪ `, "فروش"]}
              />

              <Bar
                dataKey="percent"
                radius={[6, 6, 0, 0]}
                isAnimationActive
                animationDuration={1000}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function PurchaseModeStats({ purchaseModeStats }) {
  const chartConfig = {
    percent: {
      label: "درصد فروش",
    },

    sealed: {
      label: "پلمپ",
      color: "var(--chart-2)",
    },

    decant: {
      label: "دکانت",
      color: "var(--chart-1)",
    },
  };

  const modeLabels = {
    sealed: "پلمپ",
    decant: "دکانت",
  };

  const modeChartData =
    purchaseModeStats?.map((item) => ({
      ...item,
      modeLabel: modeLabels[item.mode] ?? item.mode,
      fill: `var(--color-${item.mode})`,
    })) ?? [];

  return (
    <div className="w-full px-2 py-3">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>نوع محصولات خریداری شده 🧴</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-80 w-full">
            <PieChart accessibilityLayer>
              <Pie
                data={modeChartData}
                dataKey="percent"
                nameKey="modeLabel"
                innerRadius="55%"
                outerRadius="75%"
                paddingAngle={4}
                cornerRadius={8}
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                  />
                }
                formatter={(value, name) => [
                  `${toPersianNumbers(value)}٪ `,
                  name,
                ]}
              />
              <Legend
                formatter={(value, name) =>
                  chartConfig[name?.payload?.mode]?.label ?? name?.payload?.mode
                }
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function OrderStatusPercentages({ orderStatusPercentages }) {
  const statusConfig = {
    PENDING: {
      label: "در انتظار پرداخت",
      color: "var(--color-blue)",
    },

    PAID: {
      label: "پرداخت شده",
      color: "var(--color-violet-700)",
    },

    READY_TO_PRINT: {
      label: "آماده چاپ",
      color: "var(--color-orange)",
    },

    PRINTED: {
      label: "چاپ شده",
      color: "var(--color-success)",
    },

    SHIPPED: {
      label: "ارسال شده",
      color: "var(--color-green)",
    },

    EXPIRED: {
      label: "تحویل شده",
      color: "var(--color-stroke-600)",
    },

    CANCELLED: {
      label: "لغو شده",
      color: "var(--chart-2)",
    },
  };

  const chartConfig = Object.fromEntries(
    Object.entries(statusConfig).map(([status, config]) => [
      status,
      {
        label: config.label,
        color: config.color,
      },
    ]),
  );

  const chartData =
    orderStatusPercentages?.map((item) => ({
      ...item,
      fill: statusConfig[item.status]?.color ?? "var(--chart-1)",
    })) ?? [];

  return (
    <div className="w-full px-2 py-3">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>وضعیت سفارشات 📈</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-80 w-full">
            <RadialBarChart
              accessibilityLayer
              data={chartData}
              innerRadius="25%"
              outerRadius="85%"
              startAngle={90}
              endAngle={-270}
              isAnimationActive
              animationDuration={1000}
            >
              <RadialBar
                dataKey="percent"
                nameKey="status"
                background
                cornerRadius={6}
              />

              <Legend
                formatter={(value, name) =>
                  statusConfig[name?.payload?.status]?.label ??
                  name?.payload?.status
                }
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                  />
                }
                formatter={(value, name, data) => [
                  `${toPersianNumbers(value)}٪ `,
                  statusConfig[data?.payload?.status]?.label ??
                    data?.payload?.status,
                ]}
              />
            </RadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccordSales({ accordSales }) {
  const accordChartConfig = {
    percent: {
      label: "درصد فروش",
      color: "var(--chart-1)",
    },

    چوبی: {
      label: "چوبی",
      color: "var(--color-dark-orange)",
    },

    مرکبات: {
      label: "مرکبات",
      color: "var(--color-orange)",
    },

    گلی: {
      label: "گلی",
      color: "var(--color-rose-500)",
    },

    چرمی: {
      label: "چرمی",
      color: "var(--color-stroke-900)",
    },

    امبر: {
      label: "امبر",
      color: "var(--color-warning)",
    },

    شیپره: {
      label: "شیپره",
      color: "var(--color-brown)",
    },

    ادویه: {
      label: "ادویه",
      color: "var(--color-amber-600)",
    },

    گیاهی: {
      label: "گیاهی",
      color: "var(--color-green)",
    },
  };

  const chartData =
    accordSales?.map((item, index) => ({
      ...item,
      fill:
        accordChartConfig[item.title]?.color ??
        `var(--chart-${(index % 5) + 1})`,
    })) ?? [];

  return (
    <div className="lg:col-span-2 w-full px-2 py-3 via-violet-700">
      <Card className="w-full rounded-2xl border shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle>پرفروش‌ترین رایحه‌ها 🌿</CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer
            config={accordChartConfig}
            className="min-h-80 w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="horizontal"
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="4 4"
              />

              <XAxis
                type="category"
                dataKey="title"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />

              <YAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => toPersianNumbers(value)}
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    hideLabel={false}
                    className="rounded-xl border bg-background shadow-xl"
                  />
                }
                formatter={(value, name) => [
                  `٪${toPersianNumbers(value)}`,
                  " فروش",
                ]}
              />

              <Bar
                dataKey="percent"
                radius={[6, 6, 0, 0]}
                isAnimationActive
                animationDuration={1000}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
