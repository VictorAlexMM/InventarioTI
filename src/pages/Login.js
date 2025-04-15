import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Valida o username
      const responseValidate = await axios.post(
        "http://PC101961:5000/validateUser",
        { username }
      );

      if (!responseValidate.data.valid) {
        setError("Username não encontrado");
        setLoading(false);
        return;
      }

      const userProfile = responseValidate.data.usuario.perfil; // Exemplo: "admin" ou "aud"
      const userPlanta = responseValidate.data.usuario.planta; // Extract planta from response
      console.log("Perfil do usuário:", userProfile, "Planta:", userPlanta);

      // Salva o username, perfil, e planta no localStorage
      localStorage.setItem("loggedUser", String(username));
      localStorage.setItem("userProfile", userProfile);
      localStorage.setItem("userPlanta", userPlanta);

      // Se o perfil for admin ou aud, pula a autenticação externa
      if (userProfile === "admin" || userProfile === "aud") {
        setIsLoggedIn(username);
        navigate("/portal/home");
        setLoading(false);
        return;
      }

      // Autentica o usuário (para perfis que não são admin ou aud)
      const responseAuth = await axios.post(
        "http://10.0.11.55:31636/api/v1/AuthAd",
        { username, password, planta: userPlanta } // Include planta in the auth request
      );

      setIsLoggedIn(username);
      navigate("/portal/home");
    } catch (error) {
      if (error.response) {
        const { error: errorMessage } = error.response.data;
        if (errorMessage === "Senha incorreta") {
          setError("A senha fornecida está incorreta. Tente novamente.");
        } else {
          setError(errorMessage || "Usuário ou senha inválidos.");
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
              onKeyDown={handleKeyDown}
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
              onKeyDown={handleKeyDown}
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
