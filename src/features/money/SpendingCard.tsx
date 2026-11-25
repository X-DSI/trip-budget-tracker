import { useMemo } from 'react';
import { Link } from 'react-router';
import { formatINR, type Family } from '../../domain';
import { Card } from '../../components/ui';
import { categoryOf, type TripExpense } from '../expenses/model';
import { spendingByCategory } from '../expenses/report';

/** Spending by category, largest first. Shown whether or not a budget is set. */
export function SpendingCard({
  expenses,
  families,
  kidWeight,
  myFamilyId,
}: {
  expenses: TripExpense[];
  families: Family[];
  kidWeight: number;
  myFamilyId: string | null;
}) {
  const report = useMemo(
    () => spendingByCategory(expenses, families, kidWeight, myFamilyId),
    [expenses, families, kidWeight, myFamilyId],
  );
  if (report.rows.length === 0) return null;
  const largest = report.rows[0]!.totalPaise;

  return (
    <Card data-testid="spending-by-category">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium text-slate-900">Where the money went</h3>
        <span className="text-sm text-slate-600 tabular-nums">{formatINR(report.totalPaise)}</span>
      </div>
      <p className="text-sm text-slate-500">
        Everything spent so far, by category{myFamilyId ? ', and your family’s share' : ''}. Tap one
        to see its expenses.
      </p>
      <ul className="mt-3 space-y-1">
        {report.rows.map((row) => {
          const c = categoryOf(row.category);
          return (
            <li key={row.category} data-testid="spending-row" data-category={row.category}>
              <Link
                to={`/expenses?category=${row.category}`}
                className="-mx-2 block rounded-xl px-2 py-2 hover:bg-slate-50"
              >
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-slate-800">
                    <span aria-hidden="true">{c.emoji}</span> {c.label}
                    <span className="text-slate-500">
                      {' '}
                      · {row.count} expense{row.count === 1 ? '' : 's'}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <span className="font-medium text-slate-900">{formatINR(row.totalPaise)}</span>
                    <span className="text-slate-500"> · {row.percent}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${Math.max(2, (row.totalPaise / largest) * 100)}%` }}
                  />
                </div>
                {row.minePaise != null && row.minePaise > 0 && (
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    Your family’s share {formatINR(row.minePaise)}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
