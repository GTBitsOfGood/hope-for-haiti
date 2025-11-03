interface LeaderboardWidgetProps {
  items: { name: string; value: number }[];
}

export default function LeaderboardWidget({ items }: LeaderboardWidgetProps) {
  const topThree = items.slice(0, 3);
  const rest = items.slice(3);

  const maxTop = Math.max(...topThree.map((i) => i.value));
  const boxShades = [
    "bg-blue-primary/20",
    "bg-blue-primary/50",
    "bg-blue-primary/70",
  ];
  const borderShade = "border-blue-primary/70";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {topThree.map((item, idx) => {
          const heightPct = Math.max(
            35,
            Math.round((item.value / maxTop) * 100)
          );
          return (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-full max-w-xs h-40 flex flex-col items-center justify-end">
                <span className="text-center text-sm text-black mb-1">
                  {item.name}
                </span>
                <div
                  className={`${boxShades[idx]} border ${borderShade} rounded-md w-full flex items-end justify-center`}
                  style={{ height: `${heightPct}%` }}
                >
                  <span className="text-3xl font-bold text-white drop-shadow-sm mb-1">
                    {item.value}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rest.length > 0 && (
        <div className="mt-2 space-y-3">
          {rest.map((item, index) => (
            <div
              key={index + 3}
              className="flex items-center justify-between text-base"
            >
              <div className="flex items-center gap-4">
                <span className="text-blue-primary font-semibold w-4">
                  {index + 4}
                </span>
                <span className="text-black">{item.name}</span>
              </div>
              <span className="text-black font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
