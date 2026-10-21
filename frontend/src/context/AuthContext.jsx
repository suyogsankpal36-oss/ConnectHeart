import { useEffect, useState, useCallback } from "react";
import { AuthContext } from "./authContextInstance";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import toast from "react-hot-toast";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState({
    matchesCount: 0,
    likesSentCount: 0,
    likesReceivedCount: 0,
    unreadNotificationsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken("");
    setUser(null);
    setStats({
      matchesCount: 0,
      likesSentCount: 0,
      likesReceivedCount: 0,
      unreadNotificationsCount: 0,
    });
    disconnectSocket();
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      if (response.data.user) {
        setUser((prev) => {
          const merged = { ...prev, ...response.data.user };
          localStorage.setItem("user", JSON.stringify(merged));
          return merged;
        });
      }
      if (response.data.stats) {
        setStats(response.data.stats);
      }
      // Ensure socket is connected
      connectSocket(currentToken);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      const socket = connectSocket(token);
      refreshUser();

      if (socket) {
        const handleNewNotif = (notif) => {
          refreshUser();
          if (notif?.title && notif?.message) {
            toast(`${notif.title}: ${notif.message}`, { icon: "🔔" });
          }
        };

        const handleNewMatch = (data) => {
          refreshUser();
          toast.success(
            `✨ Mutual match with ${data?.matchedUser?.name || "someone"}!`,
            { duration: 5000, icon: "💖" }
          );
        };

        socket.on("new_notification", handleNewNotif);
        socket.on("new_match_event", handleNewMatch);

        return () => {
          socket.off("new_notification", handleNewNotif);
          socket.off("new_match_event", handleNewMatch);
        };
      }
    } else {
      disconnectSocket();
      setLoading(false);
    }
  }, [token, refreshUser]);

  function login(newToken, newUser) {
    localStorage.setItem("token", newToken);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }
    setToken(newToken);
    connectSocket(newToken);
    refreshUser();
  }

  function updateUser(updatedFields) {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        stats,
        loading,
        login,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
