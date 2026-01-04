type FrequencyBadgeProps = {
  tier: 'healing' | 'foundation';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function FrequencyBadge({
  tier,
  size = 'md',
  className = ''
}: FrequencyBadgeProps) {
  const isHealing = tier === 'healing';

  // Size variants
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  // Color variants
  const colorClasses = isHealing
    ? 'bg-[rgb(var(--color-accent))] text-[rgb(var(--color-background))]'
    : 'bg-[rgb(var(--color-muted))] text-[rgb(var(--color-text))]';

  const frequencyText = isHealing ? '5,000 HZ' : '100 HZ';

  return (
    <span
      className={`
        inline-block
        font-sans
        font-medium
        tracking-wider
        uppercase
        ${sizeClasses[size]}
        ${colorClasses}
        ${className}
      `}
    >
      {frequencyText}
    </span>
  );
}
