import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ═══ STATUS ═══
export const getStatus = () => api.get("/status").then((r) => r.data);

// ═══ EMPRESAS ═══
export const getEmpresas = () => api.get("/empresas").then((r) => r.data);
export const getEmpresa = (id) => api.get(`/empresas/${id}`).then((r) => r.data);

// ═══ ARQUIVOS ═══
export const getArquivos = (params = {}) =>
  api.get("/arquivos", { params }).then((r) => r.data);

// ═══ PROCESSAMENTO ═══
export const iniciarProcessamento = () =>
  api.post("/processar").then((r) => r.data);

export const reprocessarArquivo = (id) =>
  api.post(`/reprocessar/${id}`).then((r) => r.data);

// ═══ UPLOAD ═══
export const uploadArquivo = (empresaId, tipo, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api
    .post(`/upload/${empresaId}/${tipo}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ═══ AUTENTICAÇÃO ═══
export const login = (usuario, senha) =>
  api.post("/auth/login", { usuario, senha }).then((r) => r.data);

// ═══ HISTÓRICO ═══
export const getHistorico = (limit = 50) =>
  api.get("/historico", { params: { limit } }).then((r) => r.data);

export default api;
