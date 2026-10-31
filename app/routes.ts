import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("login", "routes/loginPage.tsx"),
    route("logout", "routes/logout.tsx"),

    layout("routes/protected-layout.tsx", [
        route("welcome", "routes/welcomePage.tsx"),
        route("products", "routes/productsPage.tsx"),
        route("checkout/return", "routes/checkoutReturnPage.tsx"),
        route("products/:id", "routes/productDetailPage.tsx"),

        layout("routes/admin-layout.tsx", [
            route("admin/products", "routes/adminProductsPage.tsx"),
            route("admin/products/new", "routes/createProductPage.tsx"),
        ]),
    ]),

    route("*", "routes/NotFound.tsx"),
] satisfies RouteConfig;
