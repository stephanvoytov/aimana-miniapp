import { RefreshCw, Search, Users as UsersIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  formatAdminDate,
  formatAdminDateTime,
  formatNumber,
  initials,
  pluralize,
  type AdminUser,
} from "@/lib/admin";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  EmptyState,
  PageHeader,
  btnSecondary,
  inputClass,
} from "@/screens/admin/ui";

export function Users({
  users,
  refreshing,
  onRefresh,
}: {
  users: AdminUser[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [search, setSearch] = useState("");

  const withOrders = users.filter((user) => user.ordersCount > 0).length;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const haystack = [
        user.name,
        user.username,
        user.firstName,
        user.lastName,
        String(user.telegramId),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [users, search]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Пользователи"
        subtitle={
          users.length > 0
            ? `${users.length} ${pluralize(users.length, "пользователь", "пользователя", "пользователей")} · ${withOrders} с заказами`
            : "Клиенты, авторизованные через Telegram"
        }
        actions={
          <button
            type="button"
            className={btnSecondary}
            onClick={onRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : undefined}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Обновление" : "Обновить"}
            </span>
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-adm-line px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-adm-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Имя, @username или Telegram ID"
              className={`${inputClass} pl-9`}
            />
          </div>
          <span className="text-[12px] text-adm-muted">
            {filtered.length} из {users.length}
          </span>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={20} />}
            title="Пользователей пока нет"
            description="Они появятся после первого открытия Mini App внутри Telegram."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={20} />}
            title="Ничего не найдено"
            description="Попробуйте другой запрос."
            action={
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setSearch("")}
              >
                Сбросить поиск
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-adm-line bg-adm-soft/70 text-[11px] font-medium uppercase tracking-wide text-adm-muted">
                  <th className="px-4 py-2.5 font-medium">Пользователь</th>
                  <th className="px-3 py-2.5 font-medium">Telegram ID</th>
                  <th className="px-3 py-2.5 font-medium">Регистрация</th>
                  <th className="px-3 py-2.5 font-medium">Заказы</th>
                  <th className="px-3 py-2.5 font-medium">Сумма</th>
                  <th className="px-4 py-2.5 font-medium">Последний заказ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adm-line/80">
                {filtered.map((user) => (
                  <tr key={user.id} className="transition hover:bg-adm-soft">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-adm-blue-soft text-[11px] font-semibold text-adm-blue">
                          {initials(user.name)}
                          {user.photoUrl && (
                            <img
                              src={user.photoUrl}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.remove();
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-adm-ink">
                            {user.name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-adm-muted">
                            {user.username ? `@${user.username}` : "без username"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[12px] tabular-nums text-adm-muted">
                      {user.telegramId}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-adm-muted">
                      {formatAdminDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex min-w-[28px] justify-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                          user.ordersCount > 0
                            ? "bg-adm-blue-soft text-adm-blue"
                            : "bg-adm-soft text-adm-muted"
                        }`}
                      >
                        {formatNumber(user.ordersCount)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[12px] font-medium tabular-nums text-adm-ink">
                      {user.totalSpent > 0
                        ? formatPrice(user.totalSpent)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-adm-muted">
                      {user.lastOrderAt
                        ? formatAdminDateTime(user.lastOrderAt)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
