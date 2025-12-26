import App from "./App.jsx";
import RequireAuth from "./routes/RequireAuth.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import News from "./pages/News.jsx";
import Profile from "./pages/Profile.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import NotFound from "./pages/NotFound.jsx";

const routes = [
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/oauth/callback", element: <OAuthCallback /> },
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "news",
        element: <News />,
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "profile/:id", element: <Profile /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
export { routes };
