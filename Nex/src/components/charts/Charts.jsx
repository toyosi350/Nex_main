/* eslint-disable react-refresh/only-export-components */
import { useId } from 'react'
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart as RLine,
  Line,
  BarChart as RBar,
  Bar,
  AreaChart as RArea,
  Area,
  PieChart as RPie,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { formatNgn } from '../../utils/format.js'

const CHART_COLORS = ['#341f1a', '#8b9f6c', '#c9976a', '#6f7fa8', '#a8443c', '#cfe1e2', '#527b82']

const tooltipStyle = {
  background: '#fff8e7',
  border: '1px solid #e2d8c8',
  borderRadius: 10,
  fontSize: 13,
  boxShadow: '0 8px 24px rgba(52,31,26,0.12)',
}

const axisProps = {
  fontSize: 12,
  stroke: '#8c817b',
  tickLine: false,
}

export function ChartTooltip({ currency, labelKey = 'label', active, payload, label }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  return (
    <div style={tooltipStyle} className="chart-tip">
      <div className="chart-tip-label">{label ?? (labelKey ? entry?.[labelKey] : '')}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tip-row">
          <span className="chart-tip-dot" style={{ background: p.color || p.fill }} />
          <span>{p.name}</span>
          <strong>{currency ? formatNgn(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function SharedTooltip({ currency, labelKey }) {
  return <Tooltip content={<ChartTooltip currency={currency} labelKey={labelKey} />} cursor={{ fill: 'rgba(52,31,26,0.04)' }} />
}

export function LineChart({ data, xKey, series, height = 260, currency = false }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RLine data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d8c8" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => (currency ? formatNgn(v) : v)} width={70} />
          <SharedTooltip currency={currency} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </RLine>
      </ResponsiveContainer>
    </div>
  )
}

export function AreaChart({ data, xKey, series, height = 260, currency = false, stacked = false }) {
  const aid = useId()
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RArea data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={`${aid}-${s.key}`} id={`${aid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color || CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d8c8" />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => (currency ? formatNgn(v) : v)} width={70} />
          <SharedTooltip currency={currency} />
          {series.map((s, i) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? 's' : undefined}
              stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
              fill={`url(#${aid}-${s.key})`}
              strokeWidth={2}
            />
          ))}
        </RArea>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChart({ data, xKey, series, height = 260, currency = true, stacked = false, layout = 'vertical' }) {
  const bars = series.map((s, i) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      name={s.name}
      stackId={stacked ? 'stack' : undefined}
      fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
      radius={layout === 'vertical' ? [4, 4, 0, 0] : [0, 4, 4, 0]}
      barSize={layout === 'vertical' ? 22 : undefined}
    />
  ))
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RBar data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} layout={layout}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2d8c8" horizontal={layout !== 'vertical'} vertical={layout === 'vertical'} />
          {layout === 'vertical' ? (
            <>
              <XAxis dataKey={xKey} {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => (currency ? formatNgn(v) : v)} width={80} />
            </>
          ) : (
            <>
              <XAxis type="number" {...axisProps} tickFormatter={(v) => (currency ? formatNgn(v) : v)} width={80} />
              <YAxis type="category" dataKey={xKey} {...axisProps} width={120} />
            </>
          )}
          <SharedTooltip currency={currency} />
          {bars}
          {series.length > 1 && <Legend />}
        </RBar>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({ data, dataKey = 'value', nameKey = 'name', height = 260, currency = true, centerLabel }) {
  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer>
        <RPie>
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="#fff8e7"
          >
            {data.map((_d, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RPie>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="chart-center">
          <div className="chart-center-main">{centerLabel.main}</div>
          <div className="chart-center-sub">{centerLabel.sub}</div>
        </div>
      )}
    </div>
  )
}

export { CHART_COLORS }