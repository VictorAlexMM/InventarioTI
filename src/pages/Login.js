import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateUsername = async (username) => {
    try {
      const response = await axios.post("http://mao-s038:5000/validateUser", {
        username,
      });
      return response.data.valid;
    } catch (error) {
      setError("Erro ao validar username");
      return false;
    }
  };

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    const isUsernameValid = await validateUsername(username);
    if (!isUsernameValid) {
      setError("Username não encontrado");
      setLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const response = await axios.post(
        "http://10.0.11.55:31636/api/v1/AuthAd",
        {
          username,
          password,
        }
      );

      localStorage.setItem("loggedUser", JSON.stringify({ username }));
      setIsLoggedIn(true);
      navigate("/portal/home");
    } catch (error) {
      if (error.response) {
        const { error: errorMessage } = error.response.data;

        if (errorMessage === "Senha incorreta") {
          setError("A senha fornecida está incorreta. Tente novamente.");
        } else {
          setError(errorMessage || "User ou senha errada.");
        }
      } else {
        setError("Erro ao fazer login. Verifique sua conexão.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex justify-center items-center h-screen w-full bg-gray-800 relative">
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage:
            'url("https://www.example.com/path/to/your/background.jpg")',
        }}
      ></div>

      <div className="relative bg-white p-8 rounded-lg shadow-lg w-full max-w-sm z-10">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown} // Adiciona suporte para pressionar Enter
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown} // Adiciona suporte para pressionar Enter
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            className={`w-full p-3 text-white font-bold rounded-lg ${
              loading ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            } focus:outline-none`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Login"}
          </button>
        </div>

        {error && <div className="text-red-500 text-center mt-4">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
