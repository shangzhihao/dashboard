"""Constants for chart payload generation."""

from __future__ import annotations

SERIES_COLORS: tuple[str, ...] = (
    "#e4002b",
    "#f47b7b",
    "#9f1f5c",
    "#ef9020",
    "#00af3e",
    "#85b7e2",
    "#29245c",
    "#ffd616",
    "#e5352b",
    "#e990ab",
    "#0081b4",
    "#96cbb3",
    "#91be3e",
    "#39a6dd",
    "#eb0973",
    "#969491",
    "#333c41",
    "#74d2e7",
    "#48a9c5",
    "#0085ad",
    "#8db9ca",
    "#4298b5",
    "#005670",
    "#00205b",
    "#009f4d",
    "#84bd00",
    "#efdf00",
    "#fe5000",
    "#da1884",
    "#a51890",
    "#0077c8",
    "#008eaa",
    "#949483",
)

TERM_STRUCTURE_LOOKBACKS: tuple[tuple[str, str, str, int], ...] = (
    ("t0", "Today", "chart.termStructure.series.today", 0),
    ("t1w", "1W Ago", "chart.termStructure.series.weekAgo", 7),
    ("t1m", "1M Ago", "chart.termStructure.series.monthAgo", 30),
    ("t3m", "3M Ago", "chart.termStructure.series.threeMonthsAgo", 90),
    ("t6m", "6M Ago", "chart.termStructure.series.sixMonthsAgo", 180),
    ("t1y", "1Y Ago", "chart.termStructure.series.yearAgo", 365),
)
