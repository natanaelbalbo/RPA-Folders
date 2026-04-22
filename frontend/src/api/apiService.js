import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Status
export const getStatus = () => api.get("/status").then((r) => r.data);

// Empresas
export const getEmpresas = () => api.get("/empresas").then((r) => r.data);
export const getEmpresa = (id) => api.get(`/empresas/${id}`).then((r) => r.data);

// Arquivos
export const getArquivos = (params = {}) =>
  api.get("/arquivos", { params }).then((r) => r.data);

// Processamento
export const processarDrive = () =>
  api.post("/processar").then((r) => r.data);

export const reprocessarArquivo = (id) =>
  api.post(`/reprocessar/${id}`).then((r) => r.data);

// Upload
export const uploadArquivo = (empresaId, tipo, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/upload/${empresaId}/${tipo}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// Autenticação
export const login = (usuario, senha) =>
  api.post("/auth/login", { usuario, senha }).then((r) => r.data);

// Histórico
export const getHistorico = (limit = 50) =>
  api.get("/historico", { params: { limit } }).then((r) => r.data);

export default api;
