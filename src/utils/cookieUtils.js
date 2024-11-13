import Cookies from 'js-cookie';

// Função para obter um cookie pelo nome
export const getCookie = (name) => {
  return Cookies.get(name);
};
