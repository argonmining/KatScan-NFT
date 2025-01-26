'use client'

import { TooltipWrapper, TooltipHeader, TooltipRow, formatPercentage, formatNumber } from './tooltips'

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const RarityDistributionTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  
  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={`${data?.category || 'Unknown'} - ${data?.rarity || 'Unknown'}`}
        subtitle="Rarity Distribution"
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Count"
          value={data?.count ? formatNumber(data.count) : 'N/A'}
          highlight
        />
        <TooltipRow 
          label="Percentage"
          value={data?.percentage ? formatPercentage(data.percentage) : 'N/A'}
        />
        <TooltipRow 
          label="Rarity Score"
          value={data?.score ? formatNumber(data.score) : 'N/A'}
        />
      </div>
    </TooltipWrapper>
  )
}

export const TraitDistributionTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={`${data.trait} Traits`}
        subtitle="Trait Distribution"
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Unique Variations"
          value={formatNumber(data.count)}
          highlight
        />
        <TooltipRow 
          label="Diversity Score"
          value={formatPercentage(data.diversityScore)}
        />
        {data.rarest && (
          <TooltipRow 
            label="Rarest Trait"
            value={data.rarest}
          />
        )}
      </div>
    </TooltipWrapper>
  )
}

export const StatisticalTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={data.name}
        subtitle="Statistical Analysis"
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Mean"
          value={formatNumber(data.mean)}
          highlight
        />
        <TooltipRow 
          label="Median"
          value={formatNumber(data.median)}
        />
        <TooltipRow 
          label="Standard Deviation"
          value={formatNumber(data.stdDev)}
        />
      </div>
    </TooltipWrapper>
  )
}

export const RealmTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={`Realm ${data.name}`}
        subtitle="Realm Analysis"
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Population"
          value={formatNumber(data.value)}
          highlight
        />
        <TooltipRow 
          label="Percentage"
          value={formatPercentage(data.percentage)}
        />
        <TooltipRow 
          label="Unique Traits"
          value={formatNumber(data.uniqueTraits)}
        />
      </div>
    </TooltipWrapper>
  )
}

export const TypeDistributionTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const total = data.value + (payload[1]?.value || 0) + (payload[2]?.value || 0);
  
  return (
    <TooltipWrapper>
      <TooltipHeader 
        title={data.name}
        subtitle="Type Distribution"
      />
      <div className="space-y-1">
        <TooltipRow 
          label="Count"
          value={formatNumber(data.value)}
          highlight
        />
        <TooltipRow 
          label="Percentage"
          value={formatPercentage((data.value / total) * 100)}
        />
        <TooltipRow 
          label="Category"
          value={data.name}
        />
      </div>
    </TooltipWrapper>
  )
} 