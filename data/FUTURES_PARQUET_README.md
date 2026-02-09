# Futures Parquet Dataset Description

## Scope

This document describes:

- `Data/futures.parquet` (non-main futures contracts)
- `Data/futures_main.parquet` (main-contract futures)

Both files are derived from CSV sources in:

- `Data/futures/*.csv` (non-main)
- `Data/futures/main/*.csv` (main)

Raw CSV source files are not modified by parquet generation.

## File Overview

### `Data/futures.parquet`

- Purpose: normalized non-main futures contracts.
- Rows: `1,419,115`
- Columns: `11`
- Size: `18,058,610` bytes (~17.22 MiB)
- Exchanges: `6` (`CFFEX`, `CZCE`, `DCE`, `GFEX`, `INE`, `SHFE`)
- Distinct items: `94`
- Date coverage in `eob`: `2006-12-14` to `2026-01-07`

### `Data/futures_main.parquet`

- Purpose: main-contract futures time series.
- Rows: `191,552`
- Columns: `8`
- Size: `3,455,520` bytes (~3.30 MiB)
- Exchanges: `6` (`CFFEX`, `CZCE`, `DCE`, `GFEX`, `INE`, `SHFE`)
- Distinct items: `91`
- Date coverage in `eob`: `2010-01-04` to `2026-01-07`

## Schema Details

### `Data/futures.parquet` schema

| Column     | Type      | Description                                                                           |
| ---------- | --------- | ------------------------------------------------------------------------------------- |
| `open`     | `float64` | Open price.                                                                           |
| `close`    | `float64` | Close price.                                                                          |
| `low`      | `float64` | Low price.                                                                            |
| `high`     | `float64` | High price.                                                                           |
| `volume`   | `int64`   | Traded volume.                                                                        |
| `eob`      | `string`  | End-of-bar timestamp as string (parseable timestamp values).                          |
| `exchange` | `string`  | Exchange code from filename, uppercased.                                              |
| `item`     | `string`  | Futures symbol/item code from filename, uppercased.                                   |
| `suffix`   | `string`  | Optional contract suffix from filename (usually empty; observed non-empty: `F`, `S`). |
| `year`     | `string`  | Contract year extracted from `YYYYMM`.                                                |
| `month`    | `string`  | Contract month extracted from `YYYYMM` (`01`-`12`).                                   |

### `Data/futures_main.parquet` schema

| Column     | Type      | Description                                                  |
| ---------- | --------- | ------------------------------------------------------------ |
| `open`     | `float64` | Open price.                                                  |
| `close`    | `float64` | Close price.                                                 |
| `low`      | `float64` | Low price.                                                   |
| `high`     | `float64` | High price.                                                  |
| `volume`   | `int64`   | Traded volume.                                               |
| `eob`      | `string`  | End-of-bar timestamp as string (parseable timestamp values). |
| `exchange` | `string`  | Exchange code from filename, uppercased.                     |
| `item`     | `string`  | Futures symbol/item code from filename, uppercased.          |

## Nullability and Data Quality

Current checks on both parquet files:

- No nulls in any column.
- `eob` values are fully parseable as datetimes.
- `futures.parquet` contract decomposition quality:
  - `year` range: `2006` to `2028`
  - `month` values: all `01` through `12`
- `suffix` in `futures.parquet`:
  - Empty string rows: `1,417,418`
  - Non-empty rows: `1,697` (`F`: `560`, `S`: `1,137`)

## Distribution Notes

### `Data/futures.parquet` rows by exchange

- `SHFE`: `497,122`
- `DCE`: `431,110`
- `CZCE`: `356,795`
- `CFFEX`: `63,677`
- `INE`: `53,532`
- `GFEX`: `16,879`

### `Data/futures_main.parquet` rows by exchange

- `DCE`: `60,525`
- `CZCE`: `53,238`
- `SHFE`: `51,579`
- `CFFEX`: `17,957`
- `INE`: `6,615`
- `GFEX`: `1,638`

## Key Differences Between the Two Parquet Files

- Contract representation:
  - `futures.parquet`: explicit `year` + `month` columns for non-main contracts.
  - `futures_main.parquet`: no contract columns; each series is the main contract.
- Suffix handling:
  - `futures.parquet` keeps `suffix`.
  - `futures_main.parquet` removes `suffix`.
- Item coverage:
  - `futures.parquet` has `94` items.
  - `futures_main.parquet` has `91` items.

## Join and Usage Guidance

- Use (`exchange`, `item`, `eob`) as the natural analysis key for both files.
- Parse `eob` explicitly in downstream code if datetime operations are required.
- When combining both files in one workflow, add an explicit flag column (for example `is_main`) to avoid ambiguity.
- Prefer `Data/futures.parquet` for contract-structure analysis (term structure, maturity buckets).
- Prefer `Data/futures_main.parquet` for continuous-series style analysis by symbol.
