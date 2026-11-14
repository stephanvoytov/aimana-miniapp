import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { StorefrontLayout } from "@/components/StorefrontLayout";
import { AdminScreen } from "@/screens/AdminScreen";
import { CartScreen } from "@/screens/CartScreen";
import { CatalogScreen } from "@/screens/CatalogScreen";
import { FavoritesScreen } from "@/screens/FavoritesScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { OrderDetailsScreen } from "@/screens/OrderDetailsScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
import { ProductScreen } from "@/screens/ProductScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";

const STOREFRONT_PREVIEW_KEY = "adminStorefrontPreview";

function resolveAdminMode(): boolean {
  const params = new URLSearchParams(window.location.search);
  const adminToken = params.get("admin");
  if (adminToken) {
    try {
      localStorage.setItem("adminToken", adminToken);
      sessionStorage.removeItem(STOREFRONT_PREVIEW_KEY);
    } catch {
      /* приватный режим */
    }
    return true;
  }
  if (params.get("storefront") === "1") return false;
  if (!localStorage.getItem("adminToken")) return false;
  return sessionStorage.getItem(STOREFRONT_PREVIEW_KEY) !== "1";
}

export function App() {
  // админка: токен из ?admin=TOKEN сохраняется в localStorage.
  // ?storefront=1 показывает витрину, не стирая токен.
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(resolveAdminMode);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("admin");
    const storefront = params.get("storefront");
    if (!token && storefront !== "1") return;

    if (token) {
      try {
        localStorage.setItem("adminToken", token);
        sessionStorage.removeItem(STOREFRONT_PREVIEW_KEY);
      } catch {
        /* приватный режим */
      }
      setIsAdmin(true);
      params.delete("admin");
      const search = params.toString();
      window.history.replaceState(
        {},
        "",
        "/admin" + (search ? `?${search}` : ""),
      );
    } else {
      sessionStorage.setItem(STOREFRONT_PREVIEW_KEY, "1");
      setIsAdmin(false);
      params.delete("storefront");
      const search = params.toString();
      const newUrl =
        window.location.pathname +
        (search ? `?${search}` : "") +
        window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const showAdmin =
    isAdmin ||
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  if (showAdmin) {
    return <AdminScreen />;
  }

  return (
    <Routes>
      <Route element={<StorefrontLayout />}>
        <Route index element={<HomeScreen />} />
        <Route path="catalog" element={<CatalogScreen />} />
        <Route path="product/:slug" element={<ProductScreen />} />
        <Route path="favorites" element={<FavoritesScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="orders" element={<OrdersScreen />} />
        <Route path="orders/:id" element={<OrderDetailsScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
