/**
 * DB column `payment_url` is exposed as `join_url` in app/API layers until the column is renamed.
 */
export function mapCircleDbRowToApi(row: Record<string, unknown>): Record<string, unknown> {
  const payment_url = row.payment_url as string | null | undefined
  const { payment_url: _p, ...rest } = row
  return { ...rest, join_url: payment_url ?? null }
}
